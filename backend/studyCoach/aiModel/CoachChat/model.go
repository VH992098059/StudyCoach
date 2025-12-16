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

var (
	FrequencyPenalty float32 = 0.6 // 提高重复惩罚，避免无限复读
	PresencePenalty  float32 = 0.4
	Temperature      float32 = 0.1
	TopP             float32 = 0.1
)

// newChatModel component initialization function of node 'AnalysisChatModel' in graph 'StudyCoachFor'
func newChatModel(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
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

// NewChatModel1 component initialization function of node 'EmotionAndCompanionChatModel' in graph 'studyCoachFor'
func newChatModel1(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		Model:            conf.ChatModel,
		APIKey:           conf.APIKey,
		BaseURL:          conf.BaseURL,
		FrequencyPenalty: &FrequencyPenalty,
		PresencePenalty:  &PresencePenalty,
		Temperature:      &Temperature,
		TopP:             &TopP,
	}
	cm, err = ark.NewChatModel(ctx, config)

	if err != nil {
		return nil, err
	}
	return cm, nil
}

func newChatModel2(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		Model:            conf.ChatModel,
		APIKey:           conf.APIKey,
		BaseURL:          conf.BaseURL,
		FrequencyPenalty: &FrequencyPenalty,
		PresencePenalty:  &PresencePenalty,
		Temperature:      &Temperature,
		TopP:             &TopP,
	}
	cm, err = ark.NewChatModel(ctx, config)
	log.Println("ReAct模型分析")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel3 component initialization function of node 'ToStudyChatModel' in graph 'studyCoachFor'
func newChatModel3(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		Model:            conf.ChatModel,
		APIKey:           conf.APIKey,
		BaseURL:          conf.BaseURL,
		FrequencyPenalty: &FrequencyPenalty,
		PresencePenalty:  &PresencePenalty,
		Temperature:      &Temperature,
		TopP:             &TopP,
	}
	cm, err = ark.NewChatModel(ctx, config)
	log.Println("ReAct模型分析")
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

func BranchNewChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		APIKey:      g.Cfg().MustGet(ctx, "Branch.apiKey").String(),
		BaseURL:     g.Cfg().MustGet(ctx, "Branch.baseURL").String(),
		Model:       g.Cfg().MustGet(ctx, "Branch.model").String(),
		TopP:        &TopP,
		Temperature: &Temperature,
	}
	cm, err = ark.NewChatModel(ctx, config)
	log.Println("分支模型分析")
	if err != nil {
		return nil, err
	}
	return cm, nil
}
