package studyCoach

import (
	v1 "backend/api/ai_chat/v1"
	"backend/studyCoach/api"
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"
	"sync"
	"testing"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
)

var ragNew = &api.Rag{}
var cfg = &common.Config{}

func init() {
	log.Println("数据库已启动")
}

func _init() error {
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	if err != nil {
		return fmt.Errorf("NewClient of es8 failed, err=%v", err)
	}

	cfg = &common.Config{
		Client:    client,
		IndexName: "study",
		APIKey:    "sk-ejjvzdhadihlscxiiypoepwllzbktvknnrlmcbngfgwxwlxz",
		BaseURL:   "https://api.siliconflow.cn/v1",
		ChatModel: "Qwen/Qwen3-Embedding-8B",
	}
	ragNew, err = api.NewRagChat(context.Background(), cfg)
	if err != nil {
		return fmt.Errorf("New of rag failed, err=%v", err)
	}
	return nil
}
func TestIndex(t *testing.T) {
	if err := _init(); err != nil {
		t.Skipf("跳过测试: %v", err)
	}
	ctx := context.Background()
	uriList := []string{
		//"./test_file/readme.md",
		// "./test_file/readme2.md",
		// "./test_file/readme.html",
		// "./test_file/test.pdf",
		"https://www.gamer520.com/98473.html",
	}
	for _, s := range uriList {
		req := &api.IndexReq{
			URI:           s,
			KnowledgeName: "niumagame",
		}
		ids, err := ragNew.Index(ctx, req)
		if err != nil {
			t.Fatal(err)
		}
		for _, id := range ids {
			t.Log(id)
		}
		time.Sleep(time.Second * 3)
	}
}

func TestRetriever(t *testing.T) {
	if err := _init(); err != nil {
		t.Skipf("跳过测试: %v", err)
	}
	ctx := context.Background()
	req := &api.RetrieveReq{
		Query:         "生化危机",
		TopK:          5,
		Score:         0.5,
		KnowledgeName: "ai学习测试内容",
	}
	msg, err := ragNew.Retriever(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	for _, m := range msg {
		t.Logf("content: %v, score: %v", m.Content, m.Score())
	}
}

func TestChat(T *testing.T) {
	if err := _init(); err != nil {
		T.Skipf("跳过测试: %v", err)
	}
	const userCount = 10
	var wg sync.WaitGroup
	wg.Add(userCount)
	fmt.Printf("开始模拟 %d 个并发用户...\n", userCount)
	for i := 0; i < userCount; i++ {
		go func(userIndex int) {
			defer wg.Done()
			reqID := fmt.Sprintf("123-user-%d", userIndex)
			req := &v1.AiChatReq{
				ID:            reqID,
				Question:      "你好",
				KnowledgeName: "",
				TopK:          5,
				Score:         0.5,
				IsNetwork:     false,
				IsStudyMode:   false,
			}
			model, _, err := api.ChatAiModel(context.Background(), req)
			if err != nil {
				// 注意：在并发测试中，建议用 t.Log 或 fmt 打印错误，而不是直接 return 整个 Test
				fmt.Printf("[User %d] Error: %v\n", userIndex, err)
				return
			}
			// 获取结果
			// 假设 Recv() 可能会阻塞直到获得结果
			resp, err := model.Recv() // 如果 Recv 返回 (response, error)
			if err != nil {
				fmt.Printf("[User %d] Recv Error: %v\n", userIndex, err)
				return
			}

			fmt.Printf("[User %d] Response: %v\n", userIndex, resp.Content)
		}(i)
	}
	wg.Wait()
	fmt.Println("所有用户请求测试完毕。")
}
