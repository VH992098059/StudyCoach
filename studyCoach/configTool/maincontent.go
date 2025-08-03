package configTool

import (
	"github.com/PuerkitoBio/goquery"
	"log"
	"net/http"
	"strings"
)

func ExtractMainContent(url string) string {
	resp, err := http.Get(url)
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
