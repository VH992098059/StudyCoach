package api

import (
	"backend/studyCoach/aiModel/CoachChat"
	"backend/studyCoach/configTool"
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	duckduckgoV2 "github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2"
	"github.com/dgraph-io/ristretto"
	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"
)

// 全局缓存和去重实例
var (
	once sync.Once
	// URL内容缓存
	urlCache *ristretto.Cache
	// 搜索结果缓存
	searchCache *ristretto.Cache
	// 防止重复请求
	searchGroup singleflight.Group
	urlGroup    singleflight.Group
	// 全局 HTTP 客户端
	httpClient *http.Client
)

func initCaches() {
	once.Do(func() {
		var err error
		urlCache, err = ristretto.NewCache(&ristretto.Config{
			NumCounters: 10000,
			MaxCost:     64 << 20, // 64MB
			BufferItems: 64,
			Cost: func(value interface{}) int64 {
				if s, ok := value.(string); ok {
					return int64(len(s))
				}
				return 1
			},
		})
		if err != nil {
			log.Fatalf("创建URL缓存失败：%v", err)
		}

		//搜索结果缓存：500个条目，每个最大2MB，总共32MB
		searchCache, err = ristretto.NewCache(&ristretto.Config{
			NumCounters: 5000,
			MaxCost:     32 << 20, // 32MB
			BufferItems: 64,
			Cost: func(value interface{}) int64 {
				if results, ok := value.([]string); ok {
					total := 0
					for _, r := range results {
						total += len(r)
					}
					return int64(total)
				}
				return 1
			},
		})
		if err != nil {
			log.Printf("创建搜索缓存失败: %v", err)
		}
		// 配置 HTTP 客户端
		httpClient = &http.Client{
			Timeout: 300 * time.Second, // 增加到5分钟，支持长时间流式响应
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		}
	})
}

// 生成缓存键
func generateCacheKey(input string) string {
	hasher := md5.New()
	hasher.Write([]byte(input))
	return hex.EncodeToString(hasher.Sum(nil))
}

// 带缓存的URL内容获取
func fetchURLContentWithCache(ctx context.Context, url string) (string, error) {
	initCaches()
	cacheKey := generateCacheKey(url)
	//检查缓存
	if cached, found := urlCache.Get(cacheKey); found {
		return cached.(string), nil
	}
	//使用singleflight防止重复请求
	result, err, _ := urlGroup.Do(url, func() (interface{}, error) {
		content := configTool.ExtractMainContent(ctx, url)
		if content != "" {
			urlCache.SetWithTTL(cacheKey, content, int64(len(content)), time.Hour)
		}
		return content, nil
	})
	if err != nil {
		return "", err
	}
	fmt.Println(result.(string))
	return result.(string), err
}

func SearchConcurrentlyWithCache(ctx context.Context, input string) []string {
	initCaches()
	cacheKey := generateCacheKey(input)
	//检查缓存
	if cached, found := searchCache.Get(cacheKey); found {
		return cached.([]string)
	}
	//使用singleflight防止重复请求
	result, err, _ := searchGroup.Do(input, func() (interface{}, error) {
		return PerformSearch(ctx, input)
	})
	if err != nil {
		log.Printf("%v", err)
		return nil
	}
	sources := result.([]string)

	// 缓存搜索结果，TTL 30分钟
	if len(sources) > 0 {
		total := 0
		for _, r := range sources {
			total += len(r)
		}
		searchCache.SetWithTTL(cacheKey, sources, int64(total), 30*time.Minute)
	}

	return sources
}

// 执行实际搜索
func PerformSearch(ctx context.Context, input string) ([]string, error) {
	// 使用 aiModel.NewTool(ctx) 构建 DuckDuckGo V2 搜索工具（带配置）
	searchTool, err := CoachChat.NewTool(ctx)
	if err != nil {
		return nil, fmt.Errorf("搜索工具初始化失败: %w", err)
	}
	// 使用ddg获取网页信息
	searchReq := &duckduckgoV2.TextSearchRequest{
		Query: input,
	}
	jsonReq, err := json.Marshal(searchReq)
	if err != nil {
		return nil, fmt.Errorf("搜索请求序列化失败: %w", err)
	}

	resp, err := searchTool.InvokableRun(ctx, string(jsonReq))
	if err != nil {
		return nil, fmt.Errorf("搜索失败: %w", err)
	}

	if !json.Valid([]byte(resp)) {
		return nil, fmt.Errorf("搜索返回无效JSON: %s", resp)
	}

	var searchResp duckduckgoV2.TextSearchResponse
	if err := json.Unmarshal([]byte(resp), &searchResp); err != nil {
		return nil, fmt.Errorf("搜索结果解析失败: %w", err)
	}
	log.Printf("搜索到 %d 条链接", len(searchResp.Results))
	for i, r := range searchResp.Results {
		log.Printf("链接[%d]: %s", i+1, r.URL)
	}

	// 使用 errgroup 进行并发抓取
	gErr, gCtx := errgroup.WithContext(ctx)

	// 限制并发数
	semaphore := make(chan struct{}, 3)

	results := make([]string, 0, len(searchResp.Results))
	resultsMu := sync.Mutex{}

	for _, resultRes := range searchResp.Results {
		result := resultRes // 避免闭包问题

		gErr.Go(func() error {
			select {
			case semaphore <- struct{}{}:
				defer func() { <-semaphore }()
			case <-gCtx.Done():
				return gCtx.Err()
			}

			content, err := fetchURLContentWithCache(gCtx, result.URL)
			if err != nil {
				log.Printf("获取URL内容失败 %s: %v", result.URL, err)
				return nil // 不中断其他请求
			}

			if content != "" {
				resultsMu.Lock()
				results = append(results, content)
				resultsMu.Unlock()
			}

			return nil
		})
	}

	if err = gErr.Wait(); err != nil {
		return nil, err
	}

	return results, nil
}
