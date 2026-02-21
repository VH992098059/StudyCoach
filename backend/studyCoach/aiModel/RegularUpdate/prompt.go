package RegularUpdate

import (
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
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// newChatTemplate component initialization function of node 'CustomChatTemplate1' in graph 'RegularUpdate'
func newChatTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	config := &ChatTemplateConfig{
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage("{{style}} Current time: {{time_now}}"),
			schema.MessagesPlaceholder("chat_history", true),
			schema.UserMessage("{{question}}"),
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
		return nil, fmt.Errorf("UpdateTemplate消息格式化结果为空")
	}
	log.Println("UpdateTemplate初始化模版输出")
	return format, nil
}
