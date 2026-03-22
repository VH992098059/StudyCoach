package integrationtest

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

// chatConcurrency 返回并发对话请求路数，用于负载场景。默认 10；可通过环境变量
// STUDYCOACH_TEST_CHAT_CONCURRENCY 覆盖，有效范围为 1～30，非法值回退为默认值。
func chatConcurrency() int {
	const def = 10
	s := os.Getenv("STUDYCOACH_TEST_CHAT_CONCURRENCY")
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 1 || n > 30 {
		return def
	}
	return n
}

// TestIntegration_ConcurrentChat_FirstByteLatency 为集成测试：并发发起 SSE 对话请求，度量首字节到达时间（TTFB）。
//
// 测试目的：在 N 路并行 POST /gateway/chat 下，统计每路 session 从发起请求到读到响应体首字节的耗时，
// 并输出 min、max、算术平均；用于观察上游 LLM 限流或排队时延迟离散度增大等现象。
//
// 前置条件：被测 HTTP 服务可访问；LLM/Embedding 等依赖已配置（否则易出现全失败或异常流）。
//
// 测试步骤：为每路生成独立 session_id，Accept: text/event-stream，读取首字节后关闭连接并丢弃后续 body。
//
// 环境变量：STUDYCOACH_TEST_BASE_URL（默认 http://127.0.0.1:8000）、STUDYCOACH_TEST_CHAT_CONCURRENCY。
//
// 运行示例：cd backend && go test ./test -run TestIntegration_ConcurrentChat_FirstByteLatency -v -count=1
//
// 跳过条件：testing.Short() 为 true 时跳过（供 CI 快速执行）。
func TestIntegration_ConcurrentChat_FirstByteLatency(t *testing.T) {
	if testing.Short() {
		t.Skip("short 模式：跳过需 LLM 的并发对话性能测试")
	}
	base := requireServer(t)
	n := chatConcurrency()
	client := &http.Client{Timeout: 3 * time.Minute}

	latencies := make([]time.Duration, n)
	errs := make([]error, n)
	sessionIDs := make([]string, n)
	var wg sync.WaitGroup
	wall := time.Now()

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			sid := uuid.NewString()
			sessionIDs[idx] = sid
			body := map[string]any{
				"id":               sid,
				"question":         "只回复：1",
				"knowledge_name":   "",
				"top_k":            3,
				"score":            0.2,
				"is_network":       false,
				"is_study_mode":    false,
				"is_deep_thinking": false,
				"uploaded_files":   []string{},
			}
			b, err := json.Marshal(body)
			if err != nil {
				errs[idx] = err
				return
			}
			req, err := http.NewRequest(http.MethodPost, base+"/gateway/chat", bytes.NewReader(b))
			if err != nil {
				errs[idx] = err
				return
			}
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Accept", "text/event-stream")

			t0 := time.Now()
			resp, err := client.Do(req)
			if err != nil {
				errs[idx] = err
				return
			}
			defer func() {
				_, _ = io.Copy(io.Discard, resp.Body)
				_ = resp.Body.Close()
			}()

			if resp.StatusCode != http.StatusOK {
				errs[idx] = errHTTPStatus{resp.StatusCode}
				return
			}
			buf := make([]byte, 1)
			_, rerr := resp.Body.Read(buf)
			if rerr != nil && rerr != io.EOF {
				errs[idx] = rerr
				return
			}
			latencies[idx] = time.Since(t0)
		}(i)
	}
	wg.Wait()
	wallElapsed := time.Since(wall)

	var failed int
	for i, e := range errs {
		if e != nil {
			failed++
			t.Logf("id=%d session_id=%s 失败: %v", i, sessionIDs[i], e)
		}
	}
	if failed == n {
		t.Fatalf("全部 %d 路请求失败，无法统计首字节延迟", n)
	}

	var ok []time.Duration
	for i, e := range errs {
		if e == nil {
			t.Logf("id=%d session_id=%s 首字节延迟=%v", i, sessionIDs[i], latencies[i])
			ok = append(ok, latencies[i])
		}
	}
	sort.Slice(ok, func(i, j int) bool { return ok[i] < ok[j] })
	minL, maxL := ok[0], ok[len(ok)-1]
	var sum time.Duration
	for _, d := range ok {
		sum += d
	}
	avg := sum / time.Duration(len(ok))
	t.Logf("并发路数=%d 成功=%d 墙上总耗时=%v", n, len(ok), wallElapsed)
	t.Logf("成功路首字节延迟算术平均=%v", avg)
	t.Logf("首字节延迟 min=%v max=%v", minL, maxL)
	if len(ok) >= 2 && maxL > 2*minL && maxL-minL >= 2*time.Second {
		t.Logf("说明：max 显著高于 min 且跨度较大时，可能与上游限流或排队相关，可结合监控与配额核对。")
	}
}

type errHTTPStatus struct {
	code int
}

func (e errHTTPStatus) Error() string {
	return "http status " + strconv.Itoa(e.code)
}
