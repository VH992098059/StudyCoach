package NormalChat

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
)

type ChatTemplateConfig struct {
	Role       schema.RoleType
	System     schema.RoleType
	FormatType schema.FormatType
	Templates  []schema.MessagesTemplate
}

// newChatTemplate component initialization function of node 'NormalChatTemplate' in graph 'NormalChat'
func newChatTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	config := &ChatTemplateConfig{
		Role:       schema.User,
		System:     schema.System,
		FormatType: schema.FString,
		Templates: []schema.MessagesTemplate{
			schema.SystemMessage(common.NormalSystemTemplate),
			schema.MessagesPlaceholder("chat_history", true),
			schema.UserMessage(common.UserTemplate),
		},
	}
	ctp = prompt.FromMessages(config.FormatType, config.Templates...)
	return ctp, nil
}
