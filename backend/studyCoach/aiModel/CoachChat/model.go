package CoachChat

import (
	"backend/studyCoach/common"
	"context"
	"log"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
)

// newChatModel component initialization function of node 'AnalysisChatModel' in graph 'studyCoachFor'
func newChatModel(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	/*config := &ollama.ChatModelConfig{
		// 基础配置
		BaseURL: "http://localhost:11434", // Ollama 服务地址
		Timeout: 30 * time.Second,         // 请求超时时间
		Model:   "0ssamaak0/xtuner-llava:llama3-8b-v1.1-int4",
	}*/

	config := &openai.ChatModelConfig{
		Model:   g.Cfg().MustGet(ctx, "Analysis.model").String(),
		APIKey:  g.Cfg().MustGet(ctx, "Analysis.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "Analysis.baseURL").String(),
	}
	cm, err = openai.NewChatModel(ctx, config)
	log.Println("意图分析模型")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func newChatModel2(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &openai.ChatModelConfig{
		Model:   conf.ChatModel,
		APIKey:  conf.APIKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = openai.NewChatModel(ctx, config)
	log.Println("ReAct模型分析")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func BranchNewChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
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

// newChatModel2 component initialization function of node 'ToStudyChatModel' in graph 'studyCoachFor'
func newChatModel3(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		Model:   conf.ChatModel,
		APIKey:  conf.APIKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel3 component initialization function of node 'NormalChatModel' in graph 'studyCoachFor'
func newChatModel4(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &openai.ChatModelConfig{
		Model:   conf.ChatModel,
		APIKey:  conf.APIKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// NewChatModel4 component initialization function of node 'EmotionAndCompanionChatModel' in graph 'studyCoachFor'
func newChatModel1(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		Model:   conf.ChatModel,
		APIKey:  conf.APIKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = ark.NewChatModel(ctx, config)

	if err != nil {
		return nil, err
	}
	return cm, nil
}

func RewriteModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		APIKey:  g.Cfg().MustGet(ctx, "rewrite.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "rewrite.baseURL").String(),
		Model:   g.Cfg().MustGet(ctx, "rewrite.model").String(),
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func QaModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &openai.ChatModelConfig{
		APIKey:  g.Cfg().MustGet(ctx, "qa.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "qa.baseURL").String(),
		Model:   g.Cfg().MustGet(ctx, "qa.model").String(),
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
