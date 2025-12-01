package NormalChat

import (
	"context"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
	modelThink "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model"
)

func newChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		APIKey:  g.Cfg().MustGet(ctx, "ark.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "ark.baseURL").String(),
		Model:   g.Cfg().MustGet(ctx, "ark.model").String(),
		Thinking: &modelThink.Thinking{
			Type: modelThink.ThinkingTypeEnabled,
		},
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
