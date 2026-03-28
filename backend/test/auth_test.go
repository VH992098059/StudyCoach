package integrationtest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"
)

func logCaseStart(t *testing.T, name string) {
	t.Helper()
	t.Logf("【开始】%s", name)
	t.Cleanup(func() {
		t.Logf("【结束】%s", name)
	})
}

func logResponseSummary(t *testing.T, scene string, status int, raw []byte) {
	t.Helper()
	if status != http.StatusOK {
		t.Logf("%s: HTTP=%d body=%s", scene, status, string(raw))
		return
	}
	w := parseGF(t, raw)
	t.Logf("%s: HTTP=%d code=%d message=%s data=%s", scene, status, w.Code, w.Message, string(w.Data))
}

func TestIntegration_UserAuth_RegisterLoginCheckJWTUpdatePasswordLogout(t *testing.T) {
	logCaseStart(t, "注册→登录→JWT校验→修改密码→登出")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	ts := time.Now().UnixNano()
	username := fmt.Sprintf("it_%d", ts)
	password := "TestPass123!"
	email := fmt.Sprintf("it_%d@example.com", ts)
	newPassword := "TestPass456!"

	// 注册
	regURL := base + "/gateway/users/register"
	st, raw := postJSON(t, client, regURL, map[string]string{
		"username": username,
		"password": password,
		"email":    email,
	}, "")
	if st != http.StatusOK {
		t.Fatalf("register HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "register")

	// 错误密码登录应失败
	loginURL := base + "/gateway/users/login"
	st, raw = postJSON(t, client, loginURL, map[string]string{
		"username": username,
		"password": "WrongPassword!!!",
	}, "")
	if st != http.StatusOK {
		t.Fatalf("login(wrong) HTTP %d: %s", st, string(raw))
	}
	var w gfAPIResponse
	_ = json.Unmarshal(raw, &w)
	if w.Code == 0 {
		t.Fatal("错误密码登录应返回非 0 code")
	}

	// 正确登录
	st, raw = postJSON(t, client, loginURL, map[string]string{
		"username": username,
		"password": password,
	}, "")
	if st != http.StatusOK {
		t.Fatalf("login HTTP %d: %s", st, string(raw))
	}
	w = mustGFCode0(t, raw, "login")
	var loginData struct {
		Token string `json:"token"`
		Uuid  string `json:"uuid"`
	}
	if err := json.Unmarshal(w.Data, &loginData); err != nil {
		t.Fatalf("login data: %v", err)
	}
	if loginData.Token == "" {
		t.Fatal("login 未返回 token")
	}
	token := loginData.Token

	// JWT 校验接口
	st, raw = getReq(t, client, base+"/gateway/jwt_info", token)
	if st != http.StatusOK {
		t.Fatalf("jwt_info HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "jwt_info")

	// 修改密码
	upURL := base + "/gateway/users/update_password"
	st, raw = postJSON(t, client, upURL, map[string]string{
		"oldPassword": password,
		"newPassword": newPassword,
	}, token)
	if st != http.StatusOK {
		t.Fatalf("update_password HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "update_password")

	// 旧密码不可再登录
	st, raw = postJSON(t, client, loginURL, map[string]string{
		"username": username,
		"password": password,
	}, "")
	_ = json.Unmarshal(raw, &w)
	if w.Code == 0 {
		t.Fatal("旧密码应无法登录")
	}

	// 新密码登录
	st, raw = postJSON(t, client, loginURL, map[string]string{
		"username": username,
		"password": newPassword,
	}, "")
	if st != http.StatusOK {
		t.Fatalf("login(new) HTTP %d: %s", st, string(raw))
	}
	w = mustGFCode0(t, raw, "login(new)")
	if err := json.Unmarshal(w.Data, &loginData); err != nil {
		t.Fatalf("login data: %v", err)
	}
	token2 := loginData.Token

	// 登出（需 Bearer）
	outURL := base + "/gateway/users/logout"
	st, raw = postJSON(t, client, outURL, map[string]any{}, token2)
	if st != http.StatusOK {
		t.Fatalf("logout HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "logout")
}

func TestIntegration_UserAuth_RegisterInvalid_EmptyUsername(t *testing.T) {
	logCaseStart(t, "注册异常：空用户名")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	st, raw := postJSON(t, client, base+"/gateway/users/register", map[string]string{
		"username": "",
		"password": "TestPass123!",
		"email":    "ok@example.com",
	}, "")
	logResponseSummary(t, "register(empty username)", st, raw)
	if st != http.StatusOK {
		t.Fatalf("register(empty username) HTTP %d: %s", st, string(raw))
	}
	w := parseGF(t, raw)
	if w.Code == 0 {
		t.Fatalf("register(empty username) should fail, got code=0, body=%s", string(raw))
	}
}

func TestIntegration_UserAuth_RegisterInvalid_ShortPassword(t *testing.T) {
	logCaseStart(t, "注册异常：密码少于6位")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	ts := time.Now().UnixNano()
	st, raw := postJSON(t, client, base+"/gateway/users/register", map[string]string{
		"username": fmt.Sprintf("u_%d", ts),
		"password": "12345",
		"email":    "ok@example.com",
	}, "")
	logResponseSummary(t, "register(short password)", st, raw)
	if st != http.StatusOK {
		t.Fatalf("register(short password) HTTP %d: %s", st, string(raw))
	}
	w := parseGF(t, raw)
	if w.Code == 0 {
		t.Fatalf("register(short password) should fail, got code=0, body=%s", string(raw))
	}
}

func TestIntegration_UserAuth_RegisterInvalid_BadEmailFormat(t *testing.T) {
	logCaseStart(t, "注册异常：邮箱格式错误")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	ts := time.Now().UnixNano()
	st, raw := postJSON(t, client, base+"/gateway/users/register", map[string]string{
		"username": fmt.Sprintf("u2_%d", ts),
		"password": "TestPass123!",
		"email":    "not-an-email",
	}, "")
	logResponseSummary(t, "register(bad email)", st, raw)
	if st != http.StatusOK {
		t.Fatalf("register(bad email) HTTP %d: %s", st, string(raw))
	}
	w := parseGF(t, raw)
	if w.Code == 0 {
		t.Fatalf("register(bad email) should fail, got code=0, body=%s", string(raw))
	}
}

func TestIntegration_UserAuth_LoginInvalid_EmptyUsername(t *testing.T) {
	logCaseStart(t, "登录异常：空用户名")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	st, raw := postJSON(t, client, base+"/gateway/users/login", map[string]string{
		"username": "",
		"password": "TestPass123!",
	}, "")
	logResponseSummary(t, "login(empty username)", st, raw)
	if st != http.StatusOK {
		t.Fatalf("login(empty username) HTTP %d: %s", st, string(raw))
	}
	w := parseGF(t, raw)
	if w.Code == 0 {
		t.Fatalf("login(empty username) should fail, got code=0, body=%s", string(raw))
	}
}

func TestIntegration_UserAuth_LoginInvalid_ShortPassword(t *testing.T) {
	logCaseStart(t, "登录异常：密码少于6位")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	ts := time.Now().UnixNano()
	username := fmt.Sprintf("it_invalid_%d", ts)
	password := "TestPass123!"
	email := fmt.Sprintf("it_invalid_%d@example.com", ts)

	st, raw := postJSON(t, client, base+"/gateway/users/register", map[string]string{
		"username": username,
		"password": password,
		"email":    email,
	}, "")
	if st != http.StatusOK {
		t.Fatalf("register(valid) HTTP %d: %s", st, string(raw))
	}
	mustGFCode0(t, raw, "register(valid)")

	st, raw = postJSON(t, client, base+"/gateway/users/login", map[string]string{
		"username": username,
		"password": "12345",
	}, "")
	logResponseSummary(t, "login(short password)", st, raw)
	if st != http.StatusOK {
		t.Fatalf("login(short password) HTTP %d: %s", st, string(raw))
	}
	w := parseGF(t, raw)
	if w.Code == 0 {
		t.Fatalf("login(short password) should fail, got code=0, body=%s", string(raw))
	}
}

func TestIntegration_UserAuth_ProtectedAPI_WithoutToken_ShouldFail(t *testing.T) {
	logCaseStart(t, "鉴权异常：缺失Token访问受保护接口")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	// 无 token 访问受保护接口：应被拒绝（中间件当前实现返回 HTTP 403）
	st, raw := getReq(t, client, base+"/gateway/v1/kb", "")
	logResponseSummary(t, "protected endpoint without token", st, raw)
	if st == http.StatusOK {
		w := parseGF(t, raw)
		if w.Code == 0 {
			t.Fatalf("protected endpoint without token should fail, got HTTP %d code=%d", st, w.Code)
		}
	}
}

func TestIntegration_UserAuth_ProtectedAPI_WithFakeToken_ShouldFail(t *testing.T) {
	logCaseStart(t, "鉴权异常：伪造Token访问受保护接口")
	base := requireServer(t)
	client := &http.Client{Timeout: 30 * time.Second}

	// 伪造 token 访问受保护接口：应被拒绝（可能是 HTTP 403，或 HTTP 200 + code=401/非0）
	fakeToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload"
	st, raw := getReq(t, client, base+"/gateway/v1/kb", fakeToken)
	logResponseSummary(t, "protected endpoint with fake token", st, raw)
	if st == http.StatusOK {
		w := parseGF(t, raw)
		if w.Code == 0 {
			t.Fatalf("protected endpoint with fake token should fail, got HTTP %d code=%d", st, w.Code)
		}
	}
}
