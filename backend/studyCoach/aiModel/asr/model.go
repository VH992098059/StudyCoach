package asr

import (
	"context"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
)

// newChatModel component initialization function of node 'ChatModelASR' in graph 'aiModelASR'
func newChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &openai.ChatModelConfig{
		APIKey:  g.Cfg().MustGet(ctx, "ark.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "ark.baseURL").String(),
		Model:   g.Cfg().MustGet(ctx, "ark.model").String(),
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
