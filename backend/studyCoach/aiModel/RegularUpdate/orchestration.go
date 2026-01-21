package RegularUpdate

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildRegularUpdate(ctx context.Context, conf *common.Config) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		CustomChatTemplate1 = "CustomChatTemplate1"
		Lambda2             = "Lambda2"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	customChatTemplate1KeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(CustomChatTemplate1, customChatTemplate1KeyOfChatTemplate)
	lambda2KeyOfLambda, err := newLambda(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(Lambda2, lambda2KeyOfLambda)
	_ = g.AddEdge(compose.START, CustomChatTemplate1)
	_ = g.AddEdge(Lambda2, compose.END)
	_ = g.AddEdge(CustomChatTemplate1, Lambda2)
	r, err = g.Compile(ctx, compose.WithGraphName("RegularUpdate"))
	if err != nil {
		return nil, err
	}
	return r, err
}
