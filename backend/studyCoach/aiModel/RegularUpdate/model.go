package RegularUpdate

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
)

func newChatModel(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
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
