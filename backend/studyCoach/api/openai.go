package api

import (
	v1 "backend/api/ai_chat/v1"
	"backend/studyCoach/aiModel/CoachChat"
	"backend/studyCoach/aiModel/indexer"
	"backend/studyCoach/aiModel/retriever"
	"backend/studyCoach/common"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/VH992098059/chat-history/eino"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gogf/gf/v2/frame/g"
)

const (
	//scoreThreshold = 1.05 // 设置一个很小的阈值
	esTopK       = 50
	esTryFindDoc = 10
)

type Rag struct {
	idxer      compose.Runnable[any, []string]
	idxerAsync compose.Runnable[[]*schema.Document, []string]
	rtrvr      compose.Runnable[string, []*schema.Document]
	qaRtrvr    compose.Runnable[string, []*schema.Document]
	client     *elasticsearch.Client
	cm         model.BaseChatModel

	//grader *grader.Grader // 暂时先弃用，使用 grader 会严重影响rag的速度
	conf *common.Config
}
type StreamType struct {
	Conf          *common.Config
	Question      string
	Knowledge     []*schema.Document
	Id            string
	Eh            *eino.History
	NetworkSearch []string
}

func ChatAiModel(ctx context.Context, req *v1.AiChatReq) (*schema.StreamReader[*schema.Message], error) {
	var rag *Rag
	var documents []*schema.Document
	var networkSearch []string
	log.Printf("[ChatAiModel] 开始处理请求 - ID: %s, 网络搜索: %v, 知识库: %s", req.ID, req.IsNetwork, req.KnowledgeName)
	//var eh = aiModel.NewEinoHistory("host=localhost user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Shanghai")
	var eh = eino.NewEinoHistory(g.Cfg().MustGet(ctx, "chat.history").String())
	//var eh = aiModel.NewEinoHistory("host=studycoach-postgres user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Shanghai")

	log.Println("用户内容：", req.Question)

	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{g.Cfg().MustGet(ctx, "es.address").String()},
	})
	esConf := &common.Config{
		Client:    client,
		APIKey:    g.Cfg().MustGet(ctx, "embedding.apiKey").String(),
		BaseURL:   g.Cfg().MustGet(ctx, "embedding.baseURL").String(),
		ChatModel: g.Cfg().MustGet(ctx, "embedding.model").String(),
		IndexName: g.Cfg().MustGet(ctx, "es.indexName").String(),
	}
	conf := &common.Config{
		APIKey:    g.Cfg().MustGet(ctx, "chat.apiKey").String(),
		BaseURL:   g.Cfg().MustGet(ctx, "chat.baseURL").String(),
		ChatModel: g.Cfg().MustGet(ctx, "chat.model").String(),
	}
	// 初始化 RAG 组件，避免后续调用空指针
	rag, err = NewRagChat(ctx, esConf)
	if err != nil {
		return nil, fmt.Errorf("init rag failed: %w", err)
	}
	// 知识库检索
	if req.KnowledgeName != "" {
		log.Printf("[ChatAiModel] 开始知识库检索 - ID: %s, 知识库: %s", req.ID, req.KnowledgeName)
		documents, err = rag.Retriever(ctx, &RetrieveReq{
			Query:         req.Question,
			TopK:          req.TopK,
			Score:         req.Score,
			KnowledgeName: req.KnowledgeName,
		})
		if err != nil {
			return nil, err
		}
		log.Printf("[ChatAiModel] 知识库检索完成 - ID: %s, 结果数量: %d", req.ID, len(documents))
		log.Printf("\n知识库内容：%s", documents)
	} else {
		log.Println("知识库未启用")
	}

	//网络搜索
	if req.IsNetwork {
		// 为网络搜索添加30秒超时控制，给URL抓取留出足够时间
		log.Printf("[ChatAiModel] 开始网络搜索 - ID: %s", req.ID)
		searchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		networkSearch = SearchConcurrentlyWithCache(searchCtx, req.Question)
		log.Printf("[ChatAiModel] 网络搜索完成 - ID: %s, 结果数量: %d", req.ID, len(networkSearch))
	}
	streamType := StreamType{
		Conf:          conf,
		Question:      req.Question,
		Knowledge:     documents,
		Id:            req.ID,
		Eh:            eh,
		NetworkSearch: networkSearch,
	}
	// 将isNetwork参数添加到上下文中，传递给stream函数
	ctxWithNetwork := context.WithValue(ctx, "isNetwork", req.IsNetwork)
	log.Printf("[ChatAiModel] 开始调用stream函数 - ID: %s", req.ID)
	streamData, err := stream(ctxWithNetwork, &streamType)
	log.Printf("[ChatAiModel] stream函数调用完成 - ID: %s, 错误: %v", req.ID, err)
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
					err = eh.SaveMessage(fullMsg, req.ID)
					if err != nil {
						fmt.Printf("save assistant message err: %v\n", err)
						return
					}
					GetMsg(fullMsg)
					return
				}
				fullMsgs = append(fullMsgs, msg)

			case err := <-errChan:
				fmt.Printf("message processing error: %v\n", err)
				return

			case <-ctx.Done():
				log.Printf("[ChatAiModel] 上下文取消 - ID: %s, 错误: %v", req.ID, ctx.Err())
				return
			}
		}
	}()
	return srs[0], nil
}
func stream(ctx context.Context, streamType *StreamType) (res *schema.StreamReader[*schema.Message], err error) {
	//var eh = aiModel.NewEinoHistory("host=localhost user=postgres password=root dbname=postgres port=5432 sslmode=disable TimeZone=Asia/Shanghai")
	history, err := streamType.Eh.GetHistory(streamType.Id, 50)
	if err != nil {
		log.Printf("获取历史记录失败: %v", err)
		return nil, fmt.Errorf("get history failed: %v", err)
	}
	log.Printf("历史记录数量: %d", len(history))

	// 构建模型，只构建一次
	modelStream, err := CoachChat.BuildstudyCoachFor(ctx, streamType.Conf)
	if err != nil {
		log.Printf("构建模型失败: %v", err)
		return nil, fmt.Errorf("构建模型失败: %v", err)
	}

	output := common.GetSafeTemplateParams()
	// 构建结构化的输入
	output["question"] = streamType.Question // 保持兼容性
	output["chat_history"] = history
	output["knowledge"] = streamType.Knowledge
	output["network"] = streamType.NetworkSearch
	// 添加重试机制，最多重试3次，但只重试Stream调用
	maxRetries := 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		res, err = modelStream.Stream(ctx, output)
		if err != nil {
			log.Printf("流式生成失败 (尝试 %d/%d): %v", attempt+1, maxRetries, err)

			// 检查上下文是否已取消，避免无意义的重试
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}

			// 如果是最后一次尝试，直接返回错误
			if attempt == maxRetries-1 {
				return nil, fmt.Errorf("llm generate failed after %d attempts: %v", maxRetries, err)
			}

			// 使用指数退避策略，但限制最大延迟时间
			backoffDelay := time.Duration(1<<uint(attempt)) * time.Second
			if backoffDelay > 5*time.Second {
				backoffDelay = 5 * time.Second
			}

			log.Printf("等待 %v 后重试...", backoffDelay)
			select {
			case <-time.After(backoffDelay):
				// 继续重试
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

func NewRagChat(ctx context.Context, conf *common.Config) (*Rag, error) {
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
	cm, err := CoachChat.QaModel(ctx)
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
func GetMsg(output *schema.Message) *schema.Message {
	return output
}
