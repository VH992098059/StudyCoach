package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"studyCoach/studyCoach/common"
	"studyCoach/studyCoach/configTool"
	eino2 "studyCoach/studyCoach/eino"

	"github.com/elastic/go-elasticsearch/v8"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo"
	"github.com/cloudwego/eino/schema"
	"github.com/wangle201210/chat-history/eino"
)

func ChatAiModel(ctx context.Context, isNetWork bool, input, id, KnowledgeName string) (*schema.StreamReader[*schema.Message], error) {
	var eh = eino.NewEinoHistory("root:root@tcp(127.0.0.1:3306)/chat_history")
	var sources []string
	log.Println("用户内容：", input)
	if isNetWork {
		//搜索工具
		searchTool, err := eino2.NewTool1(ctx)
		if err != nil {
			log.Println("搜索工具初始化失败:", err)
		}
		//使用ddg获取网页信息
		searchReq := &duckduckgo.SearchRequest{
			Query: input,
			Page:  10,
		}
		jsonReq, err := json.Marshal(searchReq)
		if err != nil {
			log.Fatalf("搜索请求序列化失败: %v", err)
			return nil, err
		}
		resp, err := searchTool.InvokableRun(ctx, string(jsonReq))
		if err != nil {
			log.Printf("搜索失败: %v", err)
		} else {
			if !json.Valid([]byte(resp)) {
				log.Printf("搜索返回无效JSON: %s", resp)
			} else {
				var searchResp duckduckgo.SearchResponse
				if err := json.Unmarshal([]byte(resp), &searchResp); err != nil {
					log.Printf("解析搜索结果失败: %v, 响应内容: %s", err, resp)
				} else {
					var searchResp duckduckgo.SearchResponse
					if err := json.Unmarshal([]byte(resp), &searchResp); err != nil {
						log.Fatal("解析搜索结果失败:", err)
						return nil, err

					}
					for _, result := range searchResp.Results {
						content := configTool.ExtractMainContent(result.Link)
						if content != "" {
							sources = append(sources, content) //将搜索到的内容添加找到sources
						}
					}
				}
			}
		}

	}

	sources = append(sources, input)
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	conf := &configTool.Config{
		Client:    client,
		ApiKey:    "***",
		BaseURL:   "https://ark.cn-beijing.volces.com/api/v3",
		Model:     "doubao-seed-1-6-flash-250715",
		IndexName: KnowledgeName,
	}

	streamData, err := stream(ctx, conf, sources, id)
	fmt.Println(id)
	if err != nil {
		return nil, fmt.Errorf("生成答案失败：%w", err)
	}
	srs := streamData.Copy(2)
	go func() {
		fullMsgs := make([]*schema.Message, 0)
		defer func() {
			srs[1].Close()
			fullMsg, err := schema.ConcatMessages(fullMsgs)
			if err != nil {
				fmt.Errorf("error concatenating messages: %v", err)
				return
			}
			err = eh.SaveMessage(fullMsg, id)
			if err != nil {
				fmt.Errorf("save assistant message err: %v", err)
				return
			}
		}()
	outer:
		for {
			select {
			case <-ctx.Done():
				fmt.Println("context done", ctx.Err())
				return
			default:
				chunk, err := srs[1].Recv()
				if err != nil {
					if errors.Is(err, io.EOF) {
						break outer
					}
				}
				fullMsgs = append(fullMsgs, chunk)

			}
		}
	}()
	return srs[0], nil
}
func stream(ctx context.Context, conf *configTool.Config, question []string, id string) (res *schema.StreamReader[*schema.Message], err error) {
	var eh = eino.NewEinoHistory("root:root@tcp(127.0.0.1:3306)/chat_history")
	history, err := eh.GetHistory(id, 20)
	if err != nil {
		return nil, err
	}
	model, err := eino2.BuildstudyCoachFor(ctx, conf)
	common.Output["question"] = question
	common.TemplateParams["chat_history"] = history
	res, err = model.Stream(ctx, common.Output)
	if err != nil {
		err = fmt.Errorf("llm generate failed: %v", err)
		return
	}
	return
}
