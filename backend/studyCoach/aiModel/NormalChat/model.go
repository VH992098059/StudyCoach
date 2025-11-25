package NormalChat

import (
	"context"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
)

func newChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{
		APIKey:  g.Cfg().MustGet(ctx, "chat.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "chat.baseURL").String(),
		Model:   g.Cfg().MustGet(ctx, "chat.model").String(),
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
