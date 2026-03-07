package NormalChat

import (
	"context"
	"log"

	"backend/studyCoach/common"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
	modelThink "github.com/volcengine/volcengine-go-sdk/service/arkruntime/model"
)

func newChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	thinkingType := "disabled"
	if v, ok := ctx.Value(common.IsDeepThinking).(bool); ok && v {
		thinkingType = "enabled"
	}
	// 联网搜索时强制禁用思考模式，否则工具调用格式可能被思考输出干扰
	if isNetwork, _ := ctx.Value("isNetwork").(bool); isNetwork {
		thinkingType = "disabled"
	}
	log.Printf("[NormalChat] 思考模式: %s (联网时强制禁用以保证工具调用)", thinkingType)
	config := &ark.ChatModelConfig{
		APIKey:  g.Cfg().MustGet(ctx, "ark.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "ark.baseURL").String(),
		Model:   g.Cfg().MustGet(ctx, "ark.model").String(),
		Thinking: &ark.Thinking{
			Type: modelThink.ThinkingType(thinkingType),
		},
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
