package asr

import (
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"

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

// newChatTemplate component initialization function of node 'CustomTemplate' in graph 'aiModelASR'
func newChatTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.
	config := &ChatTemplateConfig{
		Role:       schema.User,
		System:     schema.System,
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.SystemCoachTemplate),
			schema.MessagesPlaceholder("chat_history", true),
			schema.UserMessage(common.UserMessageTemplate),
		},
	}
	ctp = &ChatTemplateImpl{config: config}
	return ctp, nil
}

func (impl *ChatTemplateImpl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	template := prompt.FromMessages(impl.config.FormatType, impl.config.Templates...)
	format, err := template.Format(ctx, vs)
	if err != nil {
		return nil, fmt.Errorf("提示工程构建失败: %w", err)
	}
	if len(format) == 0 {
		return nil, fmt.Errorf("消息格式化结果为空")
	}
	log.Println("语音初始化模版输出")
	return format, nil
}
