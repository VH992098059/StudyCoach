package eino

import (
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"
	"time"

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

type ChatTemplate2Impl struct {
	config *ChatTemplate2Config
}

type ChatTemplate2Config struct {
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// newChatTemplate2 component initialization function of node 'ToStudyChatTemplate' in graph 'studyCoachFor'
func newChatTemplate2(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.
	config := &ChatTemplate2Config{
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.SystemCoachTemplate),
			schema.UserMessage(common.UserTemplate),
		},
	}
	ctp = &ChatTemplate2Impl{config: config}
	return ctp, nil
}

func (impl *ChatTemplate2Impl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...)
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("ToStudyChatTemplate消息格式化结果为空")
	}
	log.Println("ToStudyChatTemplate初始化模版输出")
	return format, nil
}

type ChatTemplate3Impl struct {
	config *ChatTemplate3Config
}

type ChatTemplate3Config struct {
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// newChatTemplate3 component initialization function of node 'NormalChatTemplate' in graph 'studyCoachFor'
func newChatTemplate3(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.
	config := &ChatTemplate3Config{}
	ctp = &ChatTemplate3Impl{config: config}
	return ctp, nil
}

func (impl *ChatTemplate3Impl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...)
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("NormalChatTemplate消息格式化结果为空")
	}
	log.Println("NormalChatTemplate初始化模版输出")
	return format, nil
}

var system = "你非常擅长于使用rag进行数据检索，" +
	"你的目标是在充分理解用户的问题后进行向量化检索\n" +
	"现在时间{time_now}\n" +
	"你要优化并提取搜索的查询内容。" +
	"请遵循以下规则重写查询内容：\n" +
	"- 根据用户的问题和上下文，重写应该进行搜索的关键词\n" +
	"- 如果需要使用时间，则根据当前时间给出需要查询的具体时间日期信息\n" +
	// "- 生成的查询关键词要选择合适的语言，考虑用户的问题类型使用最适合的语言进行搜索，例如某些问题应该保持用户的问题语言，而有一些则更适合翻译成英语或其他语言\n" +
	"- 保持查询简洁，查询内容通常不超过3个关键词, 最多不要超过5个关键词\n" +
	"- 参考Elasticsearch搜索查询习惯重写关键字。" +
	"- 直接返回优化后的搜索词，不要有任何额外说明。\n" +
	"- 尽量不要使用下面这些已使用过的关键词，因为之前使用这些关键词搜索到的结果不符合预期，已使用过的关键词：{used}\n" +
	"- 尽量不使用知识库名字《{knowledgeBase}》中包含的关键词\n"

// createTemplate 创建并返回一个配置好的聊天模板
func createTemplate() prompt.ChatTemplate {
	return prompt.FromMessages(schema.FString,
		// 系统消息模板
		schema.SystemMessage(system),
		// 用户消息模板
		schema.UserMessage(
			"如下是用户的问题: {question}"),
	)
}

// formatMessages 格式化消息并处理错误
func formatMessages(template prompt.ChatTemplate, data map[string]any) ([]*schema.Message, error) {
	messages, err := template.Format(context.Background(), data)
	if err != nil {
		return nil, fmt.Errorf("格式化模板失败: %w", err)
	}
	return messages, nil
}

func GetOptimizedQueryMessages(used, question, knowledgeBase string) ([]*schema.Message, error) {
	template := createTemplate()
	data := map[string]any{
		"time_now":      time.Now().Format(time.RFC3339),
		"question":      question,
		"used":          used,
		"knowledgeBase": knowledgeBase,
	}
	messages, err := formatMessages(template, data)
	if err != nil {
		return nil, err
	}
	return messages, nil
}
