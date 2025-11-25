package NormalChat

import (
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildNormalChat(ctx context.Context) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		NormalChatTemplate = "NormalChatTemplate"
		NormalModel        = "NormalModel"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	normalChatTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(NormalChatTemplate, normalChatTemplateKeyOfChatTemplate)
	normalModelKeyOfLambda, err := newLambda(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(NormalModel, normalModelKeyOfLambda)
	_ = g.AddEdge(compose.START, NormalChatTemplate)
	_ = g.AddEdge(NormalModel, compose.END)
	_ = g.AddEdge(NormalChatTemplate, NormalModel)
	r, err = g.Compile(ctx, compose.WithGraphName("NormalChat"))
	if err != nil {
		return nil, err
	}
	return r, err
}
