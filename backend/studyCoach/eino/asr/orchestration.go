package asr

import (
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildaiModelASR(ctx context.Context) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		CustomTemplate = "CustomTemplate"
		ChatModelASR   = "ChatModelASR"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	customTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(CustomTemplate, customTemplateKeyOfChatTemplate)
	chatModelASRKeyOfChatModel, err := newChatModel(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(ChatModelASR, chatModelASRKeyOfChatModel)
	_ = g.AddEdge(compose.START, CustomTemplate)
	_ = g.AddEdge(ChatModelASR, compose.END)
	_ = g.AddEdge(CustomTemplate, ChatModelASR)
	r, err = g.Compile(ctx, compose.WithGraphName("aiModelASR"))
	if err != nil {
		return nil, err
	}
	return r, err
}
