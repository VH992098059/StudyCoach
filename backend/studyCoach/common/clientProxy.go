package common

import (
	"net/http"
	"net/url"
	"os"
	"time"
)

type UserAgentTransport struct {
	Transport http.RoundTripper
}

// RoundTrip 是拦截器的核心逻辑
func (c *UserAgentTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// ⚠️ 关键修正：伪装成 Mac 上的 Chrome 浏览器
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	// 有些反爬策略检查 Referer
	req.Header.Set("Referer", "https://duckduckgo.com/")

	// 继续执行原本的请求
	return c.Transport.RoundTrip(req)
}

// ClientProxy 返回用于 DuckDuckGo 等外部请求的 HTTP 客户端。
// 支持环境变量 DDG_PROXY=0 或 DISABLE_PROXY=1 禁用代理，直连（适用于海外或无需代理的环境）。
// 默认使用 http://127.0.0.1:10808 代理（需本地运行 Clash/V2Ray 等）。
func ClientProxy() *http.Client {
	// 可通过环境变量禁用代理，直连 DuckDuckGo
	if os.Getenv("DDG_PROXY") == "0" || os.Getenv("DISABLE_PROXY") == "1" {
		transport := &UserAgentTransport{Transport: http.DefaultTransport}
		return &http.Client{Transport: transport, Timeout: 30 * time.Second}
	}

	// ⚠️ 注意：确认你的代理协议。
	// 如果是 v2ray/clash 的 HTTP 端口，用 http://
	// 如果是 SOCKS5 端口，用 socks5://127.0.0.1:10808
	proxyURL, err := url.Parse("http://10.0.0.1:7893")
	if err != nil {
		// 解析失败时回退到直连，避免返回 nil
		transport := &UserAgentTransport{Transport: http.DefaultTransport}
		return &http.Client{Transport: transport, Timeout: 30 * time.Second}
	}

	baseTransport := &http.Transport{
		Proxy:             http.ProxyURL(proxyURL),
		DisableKeepAlives: false,
	}
	finalTransport := &UserAgentTransport{Transport: baseTransport}
	return &http.Client{Transport: finalTransport, Timeout: 30 * time.Second}
}
