package integrationtest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"
)

func TestIntegration_UserAuth_RegisterLoginCheckJWTUpdatePasswordLogout(t *testing.T) {
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
