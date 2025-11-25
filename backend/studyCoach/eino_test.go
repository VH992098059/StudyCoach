package studyCoach

import (
	v1 "backend/api/ai_chat/v1"
	"backend/studyCoach/api"
	"backend/studyCoach/common"
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
var cfg = &common.Config{}

func init() {
	log.Println("数据库已启动")
}

func _init() {
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{"http://localhost:9200"},
	})
	if err != nil {
		log.Printf("NewClient of es8 failed, err=%v", err)
		return
	}

	cfg = &common.Config{
		Client:    client,
		IndexName: "study",
		APIKey:    "sk-cmtnvcaupuoizcqogdbapkqyvdmyumolprmgwetjmxsxmwtk",
		BaseURL:   "https://api.siliconflow.cn/v1",
		ChatModel: "Qwen/Qwen3-Embedding-8B",
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
		time.Sleep(time.Second * 3)
	}
}

func TestRetriever(t *testing.T) {
	_init()
	ctx := context.Background()
	req := &api.RetrieveReq{
		Query:         "战地风云6配置",
		TopK:          5,
		Score:         0.5,
		KnowledgeName: "测试知识库",
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
	_init()
	model, err := api.ChatAiModel(context.Background(), &v1.AiChatReq{ID: "123", Question: "战地6配置", KnowledgeName: "测试知识库", TopK: 5, Score: 0.5, IsNetwork: false})
	if err != nil {
		return
	}
	fmt.Println(model.Recv())
}
