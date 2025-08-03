package temp

import (
	"context"

	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
)

type ChatTemplateImpl struct {
	config *ChatTemplateConfig
}

type ChatTemplateConfig struct {
}

// newChatTemplate component initialization function of node 'AnalysisChatTemplate' in graph 'studyCoachFor'
func newChatTemplate(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.
	config := &ChatTemplateConfig{}
	ctp = &ChatTemplateImpl{config: config}
	return ctp, nil
}

func (impl *ChatTemplateImpl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	panic("implement me")
}

type ChatTemplate1Impl struct {
	config *ChatTemplate1Config
}

type ChatTemplate1Config struct {
}

// newChatTemplate1 component initialization function of node 'TaskChatTemplate' in graph 'studyCoachFor'
func newChatTemplate1(ctx context.Context) (ctp prompt.ChatTemplate, err error) {
	// TODO Modify component configuration here.
	config := &ChatTemplate1Config{}
	ctp = &ChatTemplate1Impl{config: config}
	return ctp, nil
}

func (impl *ChatTemplate1Impl) Format(ctx context.Context, vs map[string]any, opts ...prompt.Option) ([]*schema.Message, error) {
	panic("implement me")
}
