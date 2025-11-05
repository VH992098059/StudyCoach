package regular_update

import (
	"backend/studyCoach/configTool"
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildRegularUpdate(ctx context.Context, conf *configTool.Config) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		RegularUpdateChatTemplate = "RegularUpdateChatTemplate"
		Lambda2                   = "Lambda2"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	regularUpdateChatTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(RegularUpdateChatTemplate, regularUpdateChatTemplateKeyOfChatTemplate)
	lambda2KeyOfLambda, err := newLambda(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(Lambda2, lambda2KeyOfLambda)
	_ = g.AddEdge(compose.START, RegularUpdateChatTemplate)
	_ = g.AddEdge(Lambda2, compose.END)
	_ = g.AddEdge(RegularUpdateChatTemplate, Lambda2)
	r, err = g.Compile(ctx, compose.WithGraphName("RegularUpdate"))
	if err != nil {
		return nil, err
	}
	return r, err
}
