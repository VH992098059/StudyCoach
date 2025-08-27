package configTool

import (
	"context"
	"github.com/PuerkitoBio/goquery"
	"log"
	"net/http"
	"strings"
	"time"
)

func ExtractMainContent(ctx context.Context, url string) string {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		log.Println("创建请求失败:", err)
		return ""
	}

	client := &http.Client{Timeout: 30 * time.Second} // 增加到30秒匹配网络搜索场景
	resp, err := client.Do(req)
	if err != nil {
		log.Println("获取网页失败:", err)
		return ""
	}
	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		log.Println("解析网页失败:", err)
		return ""
	}

	// 优先查找 <article> 或 <main>，这些通常是文章正文
	var contentBuilder strings.Builder
	doc.Find("article, main").Each(func(i int, selection *goquery.Selection) {
		selection.Find("p").Each(func(j int, p *goquery.Selection) {
			text := strings.TrimSpace(p.Text())
			if len(text) > 50 { // 过滤掉过短无意义内容
				contentBuilder.WriteString(text + "\n")
			}
		})
	})

	// 如果未找到正文，则回退到查找所有 <p> 标签
	if contentBuilder.Len() == 0 {
		doc.Find("p").Each(func(i int, p *goquery.Selection) {
			text := strings.TrimSpace(p.Text())
			if len(text) > 50 {
				contentBuilder.WriteString(text + "\n")
			}
		})
	}

	// 移除多余空行
	mainContent := strings.TrimSpace(contentBuilder.String())
	if mainContent == "" {
		log.Println("未找到有效正文内容")
	}
	return mainContent
}
