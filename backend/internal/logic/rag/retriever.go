package rag

import (
	"backend/studyCoach/api"
	"backend/studyCoach/common"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
)

var ragSvr = &api.Rag{}

func init() {
	ctx := gctx.New()
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{g.Cfg().MustGet(ctx, "es.address").String()},
	})
	if err != nil {
		g.Log().Errorf(ctx, "NewClient of es8 failed, err=%v", err)
		return
	}
	ragSvr, err = api.NewRagChat(ctx, &common.Config{
		Client:    client,
		IndexName: g.Cfg().MustGet(ctx, "es.indexName").String(),
		APIKey:    g.Cfg().MustGet(ctx, "embedding.apiKey").String(),
		BaseURL:   g.Cfg().MustGet(ctx, "embedding.baseURL").String(),
		ChatModel: g.Cfg().MustGet(ctx, "embedding.model").String(),
	})
	if err != nil {
		g.Log().Errorf(ctx, "New of rag failed, err=%v", err)
		return
	}
}

func GetRagSvr() *api.Rag {
	return ragSvr
}
