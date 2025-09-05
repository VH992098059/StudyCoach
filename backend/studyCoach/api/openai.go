package api

import (
	"backend/studyCoach/common"
	"backend/studyCoach/configTool"
	eino2 "backend/studyCoach/eino"
	"backend/studyCoach/eino/indexer"
	"backend/studyCoach/eino/retriever"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"github.com/VH992098059/chat-history/eino"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gogf/gf/v2/frame/g"
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

func ChatAiModel(ctx context.Context, isNetWork bool, input, id, KnowledgeName string) (*schema.StreamReader[*schema.Message], error) {
	log.Printf("[ChatAiModel] 开始处理请求 - ID: %s, 网络搜索: %v, 知识库: %s", id, isNetWork, KnowledgeName)
	var eh = eino.NewEinoHistory("host=localhost user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Shanghai")
	var sources []string
	log.Println("用户内容：", input)
	//知识库检索
	/*if KnowledgeName != "" {
		log.Printf("[ChatAiModel] 开始知识库检索 - ID: %s, 知识库: %s", id, KnowledgeName)
		knowledgeSources, err := retrieverFronKnowledgeBase(ctx, input, KnowledgeName)
		if err != nil {
			log.Printf("知识库检索失败: %v", err)
		} else {
			sources = append(sources, knowledgeSources...)
			log.Printf("[ChatAiModel] 知识库检索完成 - ID: %s, 结果数量: %d", id, len(knowledgeSources))
		}
	}*/

	//网络搜索
	if isNetWork {
		// 为网络搜索添加30秒超时控制，给URL抓取留出足够时间
		log.Printf("[ChatAiModel] 开始网络搜索 - ID: %s", id)
		searchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		sources = append(sources, SearchConcurrentlyWithCache(searchCtx, input)...)
		log.Printf("[ChatAiModel] 网络搜索完成 - ID: %s, 结果数量: %d", id, len(sources))
	}
	sources = append(sources, input)
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	conf := &configTool.Config{
		Client:    client,
		ApiKey:    os.Getenv("Openai_API_Key"),
		BaseURL:   os.Getenv("base_url"),
		Model:     os.Getenv("Model_Type"),
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
	history, err := eh.GetHistory(id, 200)
	if err != nil {
		log.Printf("获取历史记录失败: %v", err)
		return nil, fmt.Errorf("get history failed: %v", err)
	}
	log.Printf("历史记录数量: %d", len(history))
	/*	for i, msg := range history {
		log.Printf("历史记录[%d]: Role=%s, Content=%s", i, msg.Role, msg.Content)
	}*/
	// 添加重试机制，最多重试3次
	maxRetries := 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		modelStream, err := eino2.BuildstudyCoachFor(ctx, conf)
		if err != nil {
			log.Printf("构建模型失败 (尝试 %d/%d): %v", attempt+1, maxRetries, err)
			if attempt == maxRetries {
				return nil, fmt.Errorf("构建模型失败，已重试%d次: %v", maxRetries, err)
			}
			continue
		}
		// 分类处理不同来源的内容
		var knowledgeContent []string
		var networkContent []string
		var userQuery string

		// 先进行分类处理
		for _, q := range question {
			if strings.HasPrefix(q, "[知识库-") {
				knowledgeContent = append(knowledgeContent, q)
			} else if strings.Contains(q, "https") || strings.Contains(q, "http") || len(q) > 500 {
				networkContent = append(networkContent, q)
			} else {
				userQuery = q
			}
		}

		log.Printf("分类结果 - 用户查询: %s, 知识库内容数量: %d, 网络内容数量: %d", userQuery, len(knowledgeContent), len(networkContent))

		output := common.GetSafeTemplateParams()
		// 构建结构化的输入
		output["user_query"] = userQuery
		output["knowledge_base"] = knowledgeContent
		output["network_search"] = networkContent
		output["question"] = question // 保持兼容性
		output["chat_history"] = history
		output["has_knowledge"] = len(knowledgeContent) > 0
		output["has_network"] = len(networkContent) > 0

		log.Printf("传递给模型的参数 - user_query: %s, has_knowledge: %v, has_network: %v, chat_history长度: %d",
			output["user_query"], output["has_knowledge"], output["has_network"], len(history))
		log.Println("完整output:", output)
		res, err = modelStream.Stream(ctx, output)
		if err != nil {
			log.Printf("流式生成失败 (尝试 %d/%d): %v", attempt+1, maxRetries, err)
			if attempt == maxRetries {
				return nil, fmt.Errorf("llm generate failed: %v", err)
			}
			select {
			case <-time.After(time.Duration(attempt+1) * time.Second):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			continue
		}

		log.Printf("流式生成成功 (尝试 %d/%d)", attempt+1, maxRetries)
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

func retrieverFronKnowledgeBase(ctx context.Context, query, indexName string) ([]string, error) {
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	if err != nil {
		return nil, fmt.Errorf("创建ES客户端失败: %w", err)
	}
	conf := &configTool.Config{
		Client:    client,
		ApiKey:    g.Cfg().MustGet(ctx, "embedding.apiKey").String(),
		BaseURL:   g.Cfg().MustGet(ctx, "embedding.baseURL").String(),
		Model:     g.Cfg().MustGet(ctx, "embedding.model").String(),
		IndexName: indexName,
	}
	// 确保索引存在
	if err = common.CreateIndexIfNotExists(ctx, client, indexName); err != nil {
		return nil, fmt.Errorf("索引初始化失败: %w", err)
	}
	buildRetriever, err := retriever.BuildRetriever(ctx, conf)
	if err != nil {
		return nil, err
	}
	docs, err := buildRetriever.Invoke(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("检索失败: %w", err)
	}
	//转换文档为字符串
	var results []string
	for _, doc := range docs {
		if doc.Content != "" {
			formatContent := fmt.Sprintf("[知识库-%s],%s", indexName, doc.Content)
			results = append(results, formatContent)
		}
	}
	log.Printf("知识库检索完成，共找到 %d 个相关文档", len(results))
	return results, nil
}

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
	cm, err := eino2.QaModel(ctx)
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
