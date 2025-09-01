package regular_update

import (
	"backend/studyCoach/configTool"
	"context"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
)

func newChatModel(ctx context.Context, conf *configTool.Config) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &ark.ChatModelConfig{
		Model:   g.Cfg().MustGet(ctx, "ark.model").String(),
		BaseURL: g.Cfg().MustGet(ctx, "ark.baseURL").String(),
		APIKey:  g.Cfg().MustGet(ctx, "ark.apiKey").String(),
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
