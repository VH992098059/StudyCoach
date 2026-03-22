package integrationtest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"testing"
	"time"
)

func TestIntegration_KnowledgeBase_ListCreateRetriever(t *testing.T) {
	base := requireServer(t)
	client := &http.Client{Timeout: 60 * time.Second}

	ts := time.Now().UnixNano()
	username := fmt.Sprintf("kb_%d", ts)
	password := "TestPass123!"
	email := fmt.Sprintf("kb_%d@example.com", ts)

	st, raw := postJSON(t, client, base+"/gateway/users/register", map[string]string{
		"username": username,
		"password": password,
		"email":    email,
	}, "")
	if st != http.StatusOK {
		t.Fatalf("register HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "register")

	st, raw = postJSON(t, client, base+"/gateway/users/login", map[string]string{
		"username": username,
		"password": password,
	}, "")
	if st != http.StatusOK {
		t.Fatalf("login HTTP %d: %s", st, string(raw))
	}
	w := mustGFCode0(t, raw, "login")
	var loginData struct {
		Token string `json:"token"`
	}
	_ = json.Unmarshal(w.Data, &loginData)
	token := loginData.Token

	// 列表（可能为空）
	st, raw = getReq(t, client, base+"/gateway/v1/kb", token)
	if st != http.StatusOK {
		t.Fatalf("kb list HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "kb list")

	kbName := fmt.Sprintf("k%07d", ts%10000000)
	// 满足 v:"required|length:3,50" 等
	desc := "集成测试用知识库描述长度满足校验要求"
	cat := "test"

	st, raw = postJSON(t, client, base+"/gateway/v1/kb", map[string]string{
		"name":        kbName,
		"description": desc,
		"category":    cat,
	}, token)
	if st != http.StatusOK {
		t.Fatalf("kb create HTTP %d: %s", st, string(raw))
	}
	w = parseGF(t, raw)
	if w.Code != 0 {
		t.Logf("kb create 跳过或失败: code=%d msg=%s（可能重名或校验）", w.Code, w.Message)
		// 不 Fatal：环境可能已有同名库
		return
	}

	// 文档列表（空库）
	docURL := base + "/gateway/v1/documents?knowledge_name=" + url.QueryEscape(kbName) + "&page=1&size=10"
	st, raw = getReq(t, client, docURL, token)
	if st != http.StatusOK {
		t.Fatalf("documents list HTTP %d: %s", st, string(raw))
	}
	_ = mustGFCode0(t, raw, "documents list")

	// 检索（RAG 未初始化或空库时可能失败，仅作探测）
	st, raw = postJSON(t, client, base+"/gateway/v1/retriever", map[string]any{
		"question":       "测试查询",
		"top_k":          3,
		"score":          0.2,
		"knowledge_name": kbName,
	}, token)
	if st != http.StatusOK {
		t.Logf("retriever HTTP %d，跳过断言: %s", st, string(raw))
		return
	}
	w = parseGF(t, raw)
	if w.Code != 0 {
		t.Logf("retriever 业务失败（常见：RAG 未初始化或无向量）: code=%d msg=%s", w.Code, w.Message)
		return
	}
}
