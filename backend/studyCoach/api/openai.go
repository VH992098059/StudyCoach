package api

import (
	"backend/studyCoach/common"
	"backend/studyCoach/configTool"
	eino2 "backend/studyCoach/eino"
	"backend/studyCoach/eino/indexer"
	"backend/studyCoach/eino/retriever"

	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/compose"
	"github.com/dgraph-io/ristretto"
	"github.com/gogf/gf/v2/frame/g"
	"golang.org/x/sync/errgroup"
	"golang.org/x/sync/singleflight"

	"github.com/elastic/go-elasticsearch/v8"

	"github.com/VH992098059/chat-history/eino"
	"github.com/cloudwego/eino-ext/components/tool/duckduckgo"
	"github.com/cloudwego/eino/schema"
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

const (
	scoreThreshold = 1.05 // 设置一个很小的阈值
	esTopK         = 50
	esTryFindDoc   = 10
)

type Rag struct {
	idxer      compose.Runnable[any, []string]
	idxerAsync compose.Runnable[[]*schema.Document, []string]
	rtrvr      compose.Runnable[string, []*schema.Document]
	qaRtrvr    compose.Runnable[string, []*schema.Document]
	client     *elasticsearch.Client
	cm         model.BaseChatModel

	//grader *grader.Grader // 暂时先弃用，使用 grader 会严重影响rag的速度
	conf *configTool.Config
}

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
	return result.(string), err
}

func searchConcurrentlyWithCache(ctx context.Context, input string) []string {
	initCaches()
	cacheKey := generateCacheKey(input)
	//检查缓存
	if cached, found := searchCache.Get(cacheKey); found {
		return cached.([]string)
	}
	//使用singleflight防止重复请求
	result, err, _ := searchGroup.Do(input, func() (interface{}, error) {
		return performSearch(ctx, input)
	})
	if err != nil {
		log.Printf("%v", err)
		return nil
	}
	sources := result.([]string)

	// 缓存搜索结果，TTL 30分钟
	if len(sources) > 0 {
		searchCache.SetWithTTL(cacheKey, sources, 0, 30*time.Minute)
	}

	return sources
}

// 执行实际搜索
func performSearch(ctx context.Context, input string) ([]string, error) {
	searchTool, err := eino2.NewTool(ctx)
	if err != nil {
		return nil, fmt.Errorf("搜索工具初始化失败: %w", err)
	}
	// 使用ddg获取网页信息
	searchReq := &duckduckgo.SearchRequest{
		Query: input,
		Page:  10,
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

	var searchResp duckduckgo.SearchResponse
	if err := json.Unmarshal([]byte(resp), &searchResp); err != nil {
		return nil, fmt.Errorf("搜索结果解析失败: %w", err)
	}

	// 使用 errgroup 进行并发抓取
	g, gCtx := errgroup.WithContext(ctx)

	// 限制并发数
	semaphore := make(chan struct{}, 3)

	results := make([]string, 0, len(searchResp.Results))
	resultsMu := sync.Mutex{}

	for _, result := range searchResp.Results {
		result := result // 避免闭包问题

		g.Go(func() error {
			select {
			case semaphore <- struct{}{}:
				defer func() { <-semaphore }()
			case <-gCtx.Done():
				return gCtx.Err()
			}

			content, err := fetchURLContentWithCache(gCtx, result.Link)
			if err != nil {
				log.Printf("获取URL内容失败 %s: %v", result.Link, err)
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

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return results, nil
}

func ChatAiModel(ctx context.Context, isNetWork bool, input, id, KnowledgeName string) (*schema.StreamReader[*schema.Message], error) {
	log.Printf("[ChatAiModel] 开始处理请求 - ID: %s, 网络搜索: %v, 知识库: %s", id, isNetWork, KnowledgeName)
	var eh = eino.NewEinoHistory("host=localhost user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Shanghai")
	var sources []string
	log.Println("用户内容：", input)
	if isNetWork {
		// 为网络搜索添加30秒超时控制，给URL抓取留出足够时间
		log.Printf("[ChatAiModel] 开始网络搜索 - ID: %s", id)
		searchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		sources = append(sources, searchConcurrentlyWithCache(searchCtx, input)...)
		log.Printf("[ChatAiModel] 网络搜索完成 - ID: %s, 结果数量: %d", id, len(sources))
	}
	sources = append(sources, input)
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	conf := &configTool.Config{
		Client:    client,
		ApiKey:    "sk-aesbjvkkkufqjzxumukzlsouhhsspmkwitvhqypdxqxchzux",
		BaseURL:   "https://api.siliconflow.cn/v1",
		Model:     "deepseek-ai/DeepSeek-V3.1",
		IndexName: KnowledgeName,
	}

	// 确保检索用的索引存在且映射正确，避免 all shards failed
	if err := common.CreateIndexIfNotExists(ctx, client, KnowledgeName); err != nil {
		log.Printf("确保索引创建失败 %s: %v", KnowledgeName, err)
		return nil, fmt.Errorf("索引初始化失败: %w", err)
	}

	// 将isNetwork参数添加到上下文中，传递给stream函数
	ctxWithNetwork := context.WithValue(ctx, "isNetwork", isNetWork)

	log.Printf("[ChatAiModel] 开始调用stream函数 - ID: %s", id)
	streamData, err := stream(ctxWithNetwork, conf, sources, id)
	log.Printf("[ChatAiModel] stream函数调用完成 - ID: %s, 错误: %v", id, err)
	if err != nil {
		return nil, fmt.Errorf("生成答案失败：%w", err)
	}
	srs := streamData.Copy(2)
	go func() {
		defer srs[1].Close()

		fullMsgs := make([]*schema.Message, 0)
		msgChan := make(chan *schema.Message, 10) //添加缓冲
		errChan := make(chan error, 1)

		go func() {
			defer close(msgChan)
			for {
				select {
				case <-ctx.Done():
					errChan <- ctx.Err()
					return
				default:
					chunk, err := srs[1].Recv()
					if err != nil {
						if errors.Is(err, io.EOF) {
							return
						}
						errChan <- err
						return
					}
					select {
					case msgChan <- chunk:
					case <-ctx.Done():
						return
					}
				}
			}
		}()
		// 处理消息
		for {
			select {
			case msg, ok := <-msgChan:
				if !ok {
					// 保存完整消息 - 保持原有逻辑
					fullMsg, err := schema.ConcatMessages(fullMsgs)
					if err != nil {
						fmt.Printf("error concatenating messages: %v\n", err)
						return
					}
					err = eh.SaveMessage(fullMsg, id)
					if err != nil {
						fmt.Printf("save assistant message err: %v\n", err)
						return
					}
					return
				}
				fullMsgs = append(fullMsgs, msg)

			case err := <-errChan:
				fmt.Printf("message processing error: %v\n", err)
				return

			case <-ctx.Done():
				log.Printf("[ChatAiModel] 上下文取消 - ID: %s, 错误: %v", id, ctx.Err())
				return
			}
		}
	}()
	return srs[0], nil
}
func stream(ctx context.Context, conf *configTool.Config, question []string, id string) (res *schema.StreamReader[*schema.Message], err error) {
	var eh = eino.NewEinoHistory("host=localhost user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Shanghai")
	history, err := eh.GetHistory(id, 20)
	if err != nil {
		return nil, err
	}

	// 添加重试机制，最多重试3次
	maxRetries := 3
	for attempt := 0; attempt <= maxRetries; attempt++ {
		model, err := eino2.BuildstudyCoachFor(ctx, conf)
		if err != nil {
			log.Printf("构建模型失败 (尝试 %d/%d): %v", attempt+1, maxRetries+1, err)
			if attempt == maxRetries {
				return nil, fmt.Errorf("构建模型失败，已重试%d次: %v", maxRetries, err)
			}
			continue
		}

		output := common.GetSafeOutput()
		templateParams := common.GetSafeTemplateParams()
		defer func() {
			common.ReleaseSafeOutput(output)
			common.ReleaseSafeTemplateParams(templateParams)
		}()
		output["question"] = question
		templateParams["chat_history"] = history

		res, err = model.Stream(ctx, output)
		if err != nil {
			log.Printf("流式生成失败 (尝试 %d/%d): %v", attempt+1, maxRetries+1, err)
			if attempt == maxRetries {
				return nil, fmt.Errorf("llm generate failed: %v", err)
			}
			// 短暂等待后重试
			select {
			case <-time.After(time.Duration(attempt+1) * time.Second):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			continue
		}

		// 成功生成，返回结果
		log.Printf("流式生成成功 (尝试 %d/%d)", attempt+1, maxRetries+1)
		return res, nil
	}

	return nil, fmt.Errorf("流式生成失败，已重试%d次", maxRetries)
}

/*func searchConcurrently(ctx context.Context, input string) []string {
	return searchConcurrentlyWithCache(ctx, input)
}

// GetHTTPClient returns the shared HTTP client with tuned timeouts and pooling
func GetHTTPClient() *http.Client {
	initCaches()
	return httpClient
}
*/

func NewRagChat(ctx context.Context, conf *configTool.Config) (*Rag, error) {
	if len(conf.IndexName) == 0 {
		return nil, fmt.Errorf("indexName is empty")
	}
	// 确保es index存在
	err := common.CreateIndexIfNotExists(ctx, conf.Client, conf.IndexName)
	if err != nil {
		return nil, err
	}
	buildIndex, err := indexer.BuildIndexer(ctx, conf)
	if err != nil {
		return nil, err
	}
	buildIndexAsync, err := indexer.BuildIndexerAsync(ctx, conf)
	if err != nil {
		return nil, err
	}
	buildRetriever, err := retriever.BuildRetriever(ctx, conf)
	if err != nil {
		return nil, err
	}
	qaCtx := context.WithValue(ctx, common.RetrieverFieldKey, common.FieldQAContentVector)
	qaRetriever, err := retriever.BuildRetriever(qaCtx, conf)
	if err != nil {
		return nil, err
	}
	cm, err := eino2.NewChatModel4(ctx)
	if err != nil {
		g.Log().Error(ctx, "GetChatModel failed, err=%v", err)
		return nil, err
	}
	return &Rag{
		idxer:      buildIndex,
		idxerAsync: buildIndexAsync,
		rtrvr:      buildRetriever,
		qaRtrvr:    qaRetriever,
		client:     conf.Client,
		cm:         cm,
		conf:       conf,
		// grader:  grader.NewGrader(cm),
	}, nil
}
