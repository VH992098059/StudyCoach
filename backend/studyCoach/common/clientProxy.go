package common

import (
	"net/http"
	"net/url"
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

func ClientProxy() *http.Client {
	// ⚠️ 注意：确认你的代理协议。
	// 如果是 v2ray/clash 的 HTTP 端口，用 http://
	// 如果是 SOCKS5 端口，用 socks5://127.0.0.1:10808
	proxyURL, err := url.Parse("http://127.0.0.1:10808")
	if err != nil {
		return nil
	}

	// 基础的 Transport（负责代理）
	baseTransport := &http.Transport{
		Proxy:             http.ProxyURL(proxyURL),
		DisableKeepAlives: false, // 建议开启 KeepAlive 提高连续请求速度
	}

	// 2. 将基础 Transport 包装进我们的拦截器中
	finalTransport := &UserAgentTransport{
		Transport: baseTransport,
	}

	// 3. 创建 Client
	client := &http.Client{
		Transport: finalTransport,   // 使用包装后的 Transport
		Timeout:   30 * time.Second, // 搜索通常很快，30秒足够，太长会卡死 Agent
	}

	return client
}
