package configTool

import (
	"backend/studyCoach/common"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

func ExtractMainContent(ctx context.Context, url string) string {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		log.Printf("创建请求失败: %s: %v", url, err)
		return ""
	}

	// 统一使用代理客户端进行外网抓取，避免直连失败
	client := common.ClientProxy()
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	} else {
		client.Timeout = 30 * time.Second
	}
	// req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	// req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	// req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("获取网页失败: %s: %v", url, err)
		return ""
	}
	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		log.Printf("解析网页失败: %s: %v", url, err)
		return ""
	}
	minLen := 20
	collect := func(sel *goquery.Selection) string {
		var b strings.Builder
		sel.Find("p, li, h2, h3").Each(func(_ int, n *goquery.Selection) {
			t := strings.TrimSpace(n.Text())
			if len([]rune(t)) >= minLen {
				b.WriteString(t)
				b.WriteString("\n")
			}
		})
		return strings.TrimSpace(b.String())
	}

	selectors := []string{
		"article",
		"main",
		"#mw-content-text",
		".mw-parser-output",
		"[itemprop='articleBody']",
		".Post-RichText",
		"div.RichText",
		"div.entry-content",
		"#content",
		"#bodyContent",
	}

	for _, s := range selectors {
		if doc.Find(s).Length() > 0 {
			c := collect(doc.Find(s))
			if c != "" {
				return c
			}
		}
	}

	c := collect(doc.Selection)
	if c != "" {
		return c
	}

	if v, ok := doc.Find("meta[name='description']").Attr("content"); ok && strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}
	if v, ok := doc.Find("meta[property='og:description']").Attr("content"); ok && strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}

	var fallback string
	doc.Find("script[type='application/ld+json']").Each(func(_ int, s *goquery.Selection) {
		if fallback != "" {
			return
		}
		raw := strings.TrimSpace(s.Text())
		if raw == "" {
			return
		}
		var m map[string]interface{}
		if err := json.Unmarshal([]byte(raw), &m); err == nil {
			if x, ok := m["articleBody"].(string); ok && strings.TrimSpace(x) != "" {
				fallback = strings.TrimSpace(x)
				return
			}
			if x, ok := m["description"].(string); ok && strings.TrimSpace(x) != "" {
				fallback = strings.TrimSpace(x)
				return
			}
		}
	})
	if fallback != "" {
		return fallback
	}

	doc.Find("script#js-initialData, script#__NEXT_DATA__").Each(func(_ int, s *goquery.Selection) {
		if fallback != "" {
			return
		}
		raw := strings.TrimSpace(s.Text())
		if raw == "" {
			return
		}
		var any interface{}
		if err := json.Unmarshal([]byte(raw), &any); err == nil {
			var scan func(interface{}) string
			scan = func(v interface{}) string {
				switch t := v.(type) {
				case string:
					if len([]rune(strings.TrimSpace(t))) >= 100 {
						return strings.TrimSpace(t)
					}
				case []interface{}:
					for _, e := range t {
						if r := scan(e); r != "" {
							return r
						}
					}
				case map[string]interface{}:
					for _, e := range t {
						if r := scan(e); r != "" {
							return r
						}
					}
				}
				return ""
			}
			if r := scan(any); r != "" {
				fallback = r
				return
			}
		}
	})
	if fallback != "" {
		return fallback
	}

	log.Printf("未找到有效正文内容: %s", url)
	return ""
}
