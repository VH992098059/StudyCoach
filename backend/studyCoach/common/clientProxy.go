package common

import (
	"net/http"
	"net/url"
	"time"
)

func ClientProxy() *http.Client {
	parse, err := url.Parse("http://127.0.0.1:10808")
	if err != nil {
		return nil
	}
	tr := &http.Transport{
		// 核心设置：指定 Proxy 函数
		Proxy: http.ProxyURL(parse),
		// 还可以设置关闭 KeepAlive 以避免某些网络问题
		DisableKeepAlives: true,
	}

	//创建 Client，把 Transport 放进去
	client := &http.Client{
		Transport: tr,
		Timeout:   60 * time.Second, // 强烈建议设置超时时间
	}
	return client
}
