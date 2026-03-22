package integrationtest

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestIntegration_Chat_SSEStreamStarts(t *testing.T) {
	base := requireServer(t)
	client := &http.Client{Timeout: 45 * time.Second}

	// 聊天接口无需 JWT
	sessionID := uuid.NewString()
	body := map[string]any{
		"id":               sessionID,
		"question":         "请只回复一个字：好",
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
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodPost, base+"/gateway/chat", bytes.NewReader(b))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("chat request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		buf := make([]byte, 512)
		n, _ := resp.Body.Read(buf)
		t.Fatalf("chat HTTP %d: %s", resp.StatusCode, string(buf[:n]))
	}
	ct := resp.Header.Get("Content-Type")
	if ct != "" && !strings.Contains(ct, "event-stream") {
		t.Logf("warning: Content-Type=%q，预期包含 event-stream", ct)
	}

	// 读取首包以确认流已建立（具体事件格式依实现而定）
	buf := make([]byte, 256)
	n, err := resp.Body.Read(buf)
	if err != nil && n == 0 {
		t.Fatalf("未读到流首包: %v", err)
	}
	if n > 0 {
		t.Logf("chat stream prefix (%d bytes): %q", n, string(buf[:n]))
	}
}
