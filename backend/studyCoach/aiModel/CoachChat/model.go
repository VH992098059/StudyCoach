package CoachChat

import (
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/smithy-go/ptr"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
)

// isOpenAICompatible 判断 baseURL 是否为 OpenAI 兼容接口（如 Siliconflow）
func isOpenAICompatible(baseURL string) bool {
	return strings.Contains(baseURL, "siliconflow") || strings.Contains(baseURL, "openai")
}

// newChatModel component initialization function of node 'AnalysisChatModel' in graph 'StudyCoachFor'
func newChatModel(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	cfg := g.Cfg()
	modelName, err := cfg.Get(ctx, "Analysis.model")
	if err != nil || modelName.String() == "" {
		return nil, fmt.Errorf("config missing: Analysis.model")
	}
	apiKey, err := cfg.Get(ctx, "Analysis.apiKey")
	if err != nil || apiKey.String() == "" {
		return nil, fmt.Errorf("config missing: Analysis.apiKey")
	}
	baseURL, err := cfg.Get(ctx, "Analysis.baseURL")
	if err != nil || baseURL.String() == "" {
		return nil, fmt.Errorf("config missing: Analysis.baseURL")
	}
	config := &ark.ChatModelConfig{
		Model:   modelName.String(),
		APIKey:  apiKey.String(),
		BaseURL: baseURL.String(),
		Thinking: &ark.Thinking{
			Type: "disabled",
		},
	}
	cm, err = ark.NewChatModel(ctx, config)
	log.Println("意图分析模型")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// NewChatModel1 component initialization function of node 'EmotionAndCompanionChatModel' in graph 'studyCoachFor'
func newChatModel1(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	if isOpenAICompatible(conf.BaseURL) {
		config := &openai.ChatModelConfig{
			Model:            conf.ChatModel,
			APIKey:           conf.APIKey,
			BaseURL:          conf.BaseURL,
			FrequencyPenalty: ptr.Float32(0.5),
			PresencePenalty:  ptr.Float32(0.3),
			Temperature:      ptr.Float32(0.8),
			TopP:             ptr.Float32(0.8),
		}
		cm, err = openai.NewChatModel(ctx, config)
	} else {
		config := &ark.ChatModelConfig{
			Model:            conf.ChatModel,
			APIKey:           conf.APIKey,
			BaseURL:          conf.BaseURL,
			FrequencyPenalty: ptr.Float32(0.5),
			PresencePenalty:  ptr.Float32(0.3),
			Temperature:      ptr.Float32(0.8),
			TopP:             ptr.Float32(0.8),
		}
		cm, err = ark.NewChatModel(ctx, config)
	}
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func newChatModel2(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	if isOpenAICompatible(conf.BaseURL) {
		// Siliconflow 等 OpenAI 兼容接口：使用 openai 客户端，避免 Ark 特有参数导致 400
		config := &openai.ChatModelConfig{
			Model:            conf.ChatModel,
			APIKey:           conf.APIKey,
			BaseURL:          conf.BaseURL,
			FrequencyPenalty: ptr.Float32(0.5),
			PresencePenalty:  ptr.Float32(0.3),
			Temperature:      ptr.Float32(0.8),
			TopP:             ptr.Float32(0.8),
		}
		cm, err = openai.NewChatModel(ctx, config)
	} else {
		config := &ark.ChatModelConfig{
			Model:            conf.ChatModel,
			APIKey:           conf.APIKey,
			BaseURL:          conf.BaseURL,
			FrequencyPenalty: ptr.Float32(0.5),
			PresencePenalty:  ptr.Float32(0.3),
			Temperature:      ptr.Float32(0.8),
			TopP:             ptr.Float32(0.8),
			Thinking: &ark.Thinking{
				Type: "disabled",
			},
		}
		cm, err = ark.NewChatModel(ctx, config)
	}
	log.Println("ReAct模型分析")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel3 component initialization function of node 'ToStudyChatModel' in graph 'studyCoachFor'
func newChatModel3(ctx context.Context, conf *common.Config) (cm model.ToolCallingChatModel, err error) {
	if isOpenAICompatible(conf.BaseURL) {
		config := &openai.ChatModelConfig{
			Model:            conf.ChatModel,
			APIKey:           conf.APIKey,
			BaseURL:          conf.BaseURL,
			FrequencyPenalty: ptr.Float32(0.5),
			PresencePenalty:  ptr.Float32(0.3),
			Temperature:      ptr.Float32(0.8),
			TopP:             ptr.Float32(0.8),
		}
		cm, err = openai.NewChatModel(ctx, config)
	} else {
		config := &ark.ChatModelConfig{
			Model:            conf.ChatModel,
			APIKey:           conf.APIKey,
			BaseURL:          conf.BaseURL,
			FrequencyPenalty: ptr.Float32(0.5),
			PresencePenalty:  ptr.Float32(0.3),
			Temperature:      ptr.Float32(0.8),
			TopP:             ptr.Float32(0.8),
		}
		cm, err = ark.NewChatModel(ctx, config)
	}
	log.Println("ToStudyChatModel 模型")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func RewriteModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	cfg := g.Cfg()
	apiKey, err := cfg.Get(ctx, "rewrite.apiKey")
	if err != nil || apiKey.String() == "" {
		return nil, fmt.Errorf("config missing: rewrite.apiKey")
	}
	baseURL, err := cfg.Get(ctx, "rewrite.baseURL")
	if err != nil || baseURL.String() == "" {
		return nil, fmt.Errorf("config missing: rewrite.baseURL")
	}
	modelName, err := cfg.Get(ctx, "rewrite.model")
	if err != nil || modelName.String() == "" {
		return nil, fmt.Errorf("config missing: rewrite.model")
	}
	config := &ark.ChatModelConfig{
		APIKey:  apiKey.String(),
		BaseURL: baseURL.String(),
		Model:   modelName.String(),
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func QaModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	cfg := g.Cfg()
	apiKey, err := cfg.Get(ctx, "qa.apiKey")
	if err != nil || apiKey.String() == "" {
		return nil, fmt.Errorf("config missing: qa.apiKey")
	}
	baseURL, err := cfg.Get(ctx, "qa.baseURL")
	if err != nil || baseURL.String() == "" {
		return nil, fmt.Errorf("config missing: qa.baseURL")
	}
	modelName, err := cfg.Get(ctx, "qa.model")
	if err != nil || modelName.String() == "" {
		return nil, fmt.Errorf("config missing: qa.model")
	}
	config := &openai.ChatModelConfig{
		APIKey:  apiKey.String(),
		BaseURL: baseURL.String(),
		Model:   modelName.String(),
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func BranchNewChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	cfg := g.Cfg()
	apiKey, err := cfg.Get(ctx, "Branch.apiKey")
	if err != nil || apiKey.String() == "" {
		return nil, fmt.Errorf("config missing: Branch.apiKey")
	}
	baseURL, err := cfg.Get(ctx, "Branch.baseURL")
	if err != nil || baseURL.String() == "" {
		return nil, fmt.Errorf("config missing: Branch.baseURL")
	}
	modelName, err := cfg.Get(ctx, "Branch.model")
	if err != nil || modelName.String() == "" {
		return nil, fmt.Errorf("config missing: Branch.model")
	}
	config := &ark.ChatModelConfig{
		APIKey:           apiKey.String(),
		BaseURL:          baseURL.String(),
		Model:            modelName.String(),
		FrequencyPenalty: ptr.Float32(0.5),
		PresencePenalty:  ptr.Float32(0.3),
		Temperature:      ptr.Float32(0.8),
		TopP:             ptr.Float32(0.8),
		Thinking: &ark.Thinking{
			Type: "disabled",
		},
	}
	cm, err = ark.NewChatModel(ctx, config)
	log.Println("分支模型分析")
	if err != nil {
		return nil, err
	}
	return cm, nil
}
