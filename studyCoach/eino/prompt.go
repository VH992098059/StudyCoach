package eino

import (
	"context"
	"fmt"
	"log"
	"studyCoach/studyCoach/common"

	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
)

type ChatTemplateImpl struct {
	config *ChatTemplateConfig
}

type ChatTemplateConfig struct {
	Role       schema.RoleType
	System     schema.RoleType
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// 分析用户问题模版
// newChatTemplate component initialization function of node 'AnalysisChatTemplate' in graph 'studyCoachFor'
func newChatTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.
	config := &ChatTemplateConfig{
		Role:       schema.User,
		System:     schema.System,
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.AnalysisSystemTemplate), // 专门的意图分析提示词
			schema.UserMessage(common.UserMessageTemplate),
		},
	}
	ctp = &ChatTemplateImpl{config: config}
	return ctp, nil
}

func (impl *ChatTemplateImpl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	/*初始化模版*/
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...) //修改了此处
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("消息格式化结果为空")
	}
	log.Println("意图分析初始化模版输出")
	return format, nil
}

type ChatTemplate1Impl struct {
	config *ChatTemplate1Config
}

type ChatTemplate1Config struct {
	Role       schema.RoleType
	System     schema.RoleType
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// 任务模版
// newChatTemplate1 component initialization function of node 'TaskChatTemplate' in graph 'studyCoachFor'
func newChatTemplate1(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.

	config := &ChatTemplate1Config{
		Role:       schema.User,
		System:     schema.System,
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.SystemCoachTemplate),
			schema.MessagesPlaceholder("chat_history", true),
			schema.UserMessage(common.UserMessageTemplate),
		},
	}
	ctp = &ChatTemplate1Impl{config: config}
	return ctp, nil
}

func (impl *ChatTemplate1Impl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	/*初始化模版*/
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...)
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("消息格式化结果为空")
	}
	log.Println("初始化模版输出")
	return format, nil
}

type BranchChatTemplateImpl struct {
	config *BranchChatTemplateConfig
}

type BranchChatTemplateConfig struct {
	//Role       schema.RoleType
	//System     schema.RoleType
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// 分支判断模版
func BranchChatTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	config := &BranchChatTemplateConfig{
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.BranchSystemTemplate),
			schema.UserMessage(common.UserTemplate),
		},
	}
	ctp = &BranchChatTemplateImpl{config: config}
	return ctp, nil
}
func (impl *BranchChatTemplateImpl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...)
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("消息格式化结果为空")
	}
	log.Println("Branch分支初始化模版输出")
	return format, nil
}

type EmotionAndCompanionShipChatTemplateImpl struct {
	config *EmotionAndCompanionShipChatTemplateConfig
}

type EmotionAndCompanionShipChatTemplateConfig struct {
	//Role       schema.RoleType
	//System     schema.RoleType
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// 情感判断模版
func EmotionAndCompanionShipTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	config := &EmotionAndCompanionShipChatTemplateConfig{
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.EmotionAndCompanionShipTemplate),
			schema.UserMessage(common.UserTemplate),
		},
	}
	ctp = &EmotionAndCompanionShipChatTemplateImpl{config: config}
	return ctp, nil
}
func (impl *EmotionAndCompanionShipChatTemplateImpl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...)
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("EmotionAndCompanionShip消息格式化结果为空")
	}
	log.Println("EmotionAndCompanionShip初始化模版输出")
	return format, nil
}
