package studyCoach

import (
	"backend/studyCoach/api"
	"backend/studyCoach/configTool"
	"context"
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
)

var ragNew = &api.Rag{}
var cfg = &configTool.Config{}

func init() {
	// 简单初始化，不尝试设置配置路径
	// 确保 MySQL 和 PostgreSQL 驱动都已导入
	log.Println("初始化测试环境...")
}

func _init() {
	// 不使用 ctx 变量，避免未使用的变量错误
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	if err != nil {
		log.Printf("NewClient of es8 failed, err=%v", err)
		return
	}

	// 使用硬编码的配置值，避免依赖配置文件
	cfg = &configTool.Config{
		Client:    client,
		IndexName: "niumagame",
		ApiKey:    "sk-hkjdxdzxuggryqehktwxsujcaofpfljfabmqktjmwgkmgyfg",
		BaseURL:   "https://api.siliconflow.cn/v1",
		Model:     "Qwen/Qwen3-Embedding-8B",
		ChatModel: "Pro/deepseek-ai/DeepSeek-R1",
	}
	ragNew, err = api.NewRagChat(context.Background(), cfg)
	if err != nil {
		log.Printf("New of rag failed, err=%v", err)
		return
	}
}
func TestIndex(t *testing.T) {
	_init()
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
		// QA 是异步的，不sleep后面会直接停掉
		time.Sleep(time.Second * 3)
	}
}

// 新增测试函数：专门测试等待用户输入的逻辑
func TestWaitingUserInput(t *testing.T) {
	// 设置waiting_user_input状态来测试循环检测逻辑
	ctx := context.Background()

	fmt.Println(api.ChatAiModel(ctx, true, "现在我要学习vue，帮我整理核心内容，规划学习路线并说出这些核心组件的详情作用", "12313", "test"))
}
