package integrationtest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"testing"
	"time"
)

// TestIntegration_Perf_ConcurrentLogin 为集成性能测试：并发执行注册后立即登录，统计每路协程耗时及算术平均。
//
// 测试目的：验证高并发下注册与登录接口的可用性，并输出 per-id 处理时间与整体墙上时间。
//
// 前置条件：被测 HTTP 服务可访问（requireServer 通过 /healthz 探测）。
//
// 环境变量：STUDYCOACH_TEST_BASE_URL；STUDYCOACH_TEST_CONCURRENCY 指定并发数（1～50，默认 50）。
func TestIntegration_Perf_ConcurrentLogin(t *testing.T) {
	base := requireServer(t)
	n := 50
	if v := os.Getenv("STUDYCOACH_TEST_CONCURRENCY"); v != "" {
		var x int
		_, _ = fmt.Sscanf(v, "%d", &x)
		if x > 0 && x <= 50 {
			n = x
		}
	}
	client := &http.Client{Timeout: 30 * time.Second}

	ts := time.Now().Format("2006-01-02")
	password := "TestPass123!"

	var wg sync.WaitGroup
	var mu sync.Mutex
	var errs int
	durations := make([]time.Duration, n)
	start := time.Now()

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			t0 := time.Now()
			defer func() { durations[i] = time.Since(t0) }()

			username := fmt.Sprintf("perf_%s_%d", ts, i)
			email := fmt.Sprintf("perf_%s_%d@ex.com", ts, i)
			st, raw := postJSON(t, client, base+"/gateway/users/register", map[string]string{
				"username": username,
				"password": password,
				"email":    email,
			}, "")
			if st != http.StatusOK {
				mu.Lock()
				errs++
				mu.Unlock()
				t.Errorf("register %s HTTP %d %s", username, st, string(raw))
				return
			}
			var w gfAPIResponse
			_ = json.Unmarshal(raw, &w)
			if w.Code != 0 {
				mu.Lock()
				errs++
				mu.Unlock()
				t.Errorf("register %s code=%d", username, w.Code)
				return
			}
			st, raw = postJSON(t, client, base+"/gateway/users/login", map[string]string{
				"username": username,
				"password": password,
			}, "")
			if st != http.StatusOK {
				mu.Lock()
				errs++
				mu.Unlock()
				t.Errorf("login %s HTTP %d", username, st)
				return
			}
			_ = json.Unmarshal(raw, &w)
			if w.Code != 0 {
				mu.Lock()
				errs++
				mu.Unlock()
				t.Errorf("login %s code=%d", username, w.Code)
				return
			}
			var d struct {
				Token string `json:"token"`
			}
			_ = json.Unmarshal(w.Data, &d)
			if d.Token == "" {
				mu.Lock()
				errs++
				mu.Unlock()
				t.Errorf("login %s empty token", username)
			}
		}(i)
	}
	wg.Wait()
	elapsed := time.Since(start)

	var sum time.Duration
	for i := 0; i < n; i++ {
		t.Logf("id=%d 注册+登录处理时间=%v", i, durations[i])
		sum += durations[i]
	}
	avg := sum / time.Duration(n)
	t.Logf("各协程处理时间算术平均=%v（单路从发起到注册+登录结束）", avg)
	t.Logf("并发注册+登录 n=%d 墙上总耗时=%v，失败数 %d", n, elapsed, errs)
	if errs > 0 {
		t.Fatalf("存在失败用例")
	}
}
