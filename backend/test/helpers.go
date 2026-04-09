package integrationtest

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

// gfAPIResponse 与后端统一 JSON 外层约定一致（code/message/data），便于解析集成测试结果。
type gfAPIResponse struct {
	Code    int             `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

func baseURL() string {
	u := os.Getenv("STUDYCOACH_TEST_BASE_URL")
	if u == "" {
		u = "http://localhost:8000"
	}
	return strings.TrimRight(strings.TrimSpace(u), "/")
}

// requireServer 探测 baseURL+/healthz；不可达时跳过当前测试，避免无服务环境下的误失败。
func requireServer(t *testing.T) string {
	t.Helper()
	u := baseURL()
	c := &http.Client{Timeout: 3 * time.Second}
	resp, err := c.Get(u + "/healthz")
	if err != nil {
		t.Skipf("前置条件不满足：无法连接 %s (%v)。请启动被测服务或设置 STUDYCOACH_TEST_BASE_URL。", u, err)
		return ""
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Skipf("前置条件不满足：%s/healthz 返回 HTTP %d", u, resp.StatusCode)
		return ""
	}
	return u
}

func postJSON(t *testing.T, client *http.Client, url string, body any, authBearer string) (status int, raw []byte) {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if authBearer != "" {
		req.Header.Set("Authorization", "Bearer "+authBearer)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Do: %v", err)
	}
	defer resp.Body.Close()
	raw, _ = io.ReadAll(resp.Body)
	return resp.StatusCode, raw
}

func getReq(t *testing.T, client *http.Client, url string, authBearer string) (status int, raw []byte) {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	if authBearer != "" {
		req.Header.Set("Authorization", "Bearer "+authBearer)
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Do: %v", err)
	}
	defer resp.Body.Close()
	raw, _ = io.ReadAll(resp.Body)
	return resp.StatusCode, raw
}

func parseGF(t *testing.T, raw []byte) gfAPIResponse {
	t.Helper()
	var w gfAPIResponse
	if err := json.Unmarshal(raw, &w); err != nil {
		t.Fatalf("响应非 JSON 或结构不符: %v, body=%s", err, string(raw))
	}
	return w
}

func mustGFCode0(t *testing.T, raw []byte, ctx string) gfAPIResponse {
	t.Helper()
	w := parseGF(t, raw)
	if w.Code != 0 {
		t.Fatalf("%s: code=%d message=%s data=%s", ctx, w.Code, w.Message, string(w.Data))
	}
	return w
}
