package eino

import (
	"backend/studyCoach/configTool"
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildstudyCoachFor(ctx context.Context, conf *configTool.Config) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		AnalysisChatTemplate            = "AnalysisChatTemplate"
		AnalysisChatModel               = "AnalysisChatModel"
		EmotionAndCompanionShipLambda   = "EmotionAndCompanionShipLambda"
		ChatLambda                      = "ChatLambda"
		ToStudyLambda                   = "ToStudyLambda"
		NormalLambda                    = "NormalLambda"
		EmotionAndCompanionChatModel    = "EmotionAndCompanionChatModel"
		TaskChatTemplate                = "TaskChatTemplate"
		ReActLambda                     = "ReActLambda"
		ToStudyChatTemplate             = "ToStudyChatTemplate"
		ToStudyChatModel                = "ToStudyChatModel"
		NormalChatTemplate              = "NormalChatTemplate"
		NormalChatModel                 = "NormalChatModel"
		EmotionAndCompanionShipTemplate = "EmotionAndCompanionShipTemplate"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	analysisChatTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(AnalysisChatTemplate, analysisChatTemplateKeyOfChatTemplate)
	analysisChatModelKeyOfChatModel, err := newChatModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(AnalysisChatModel, analysisChatModelKeyOfChatModel)
	_ = g.AddLambdaNode(EmotionAndCompanionShipLambda, compose.InvokableLambda(newLambda))
	_ = g.AddLambdaNode(ChatLambda, compose.InvokableLambda(newLambda1))
	_ = g.AddLambdaNode(ToStudyLambda, compose.InvokableLambda(newLambda2))
	_ = g.AddLambdaNode(NormalLambda, compose.InvokableLambda(newLambda3))
	emotionAndCompanionChatModelKeyOfChatModel, err := newChatModel1(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(EmotionAndCompanionChatModel, emotionAndCompanionChatModelKeyOfChatModel)
	taskChatTemplateKeyOfChatTemplate, err := newChatTemplate1(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(TaskChatTemplate, taskChatTemplateKeyOfChatTemplate)
	reActLambdaKeyOfLambda, err := newLambda4(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(ReActLambda, reActLambdaKeyOfLambda)
	toStudyChatTemplateKeyOfChatTemplate, err := newChatTemplate2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(ToStudyChatTemplate, toStudyChatTemplateKeyOfChatTemplate)
	toStudyChatModelKeyOfChatModel, err := newChatModel3(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(ToStudyChatModel, toStudyChatModelKeyOfChatModel)
	normalChatTemplateKeyOfChatTemplate, err := newChatTemplate3(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(NormalChatTemplate, normalChatTemplateKeyOfChatTemplate)
	normalChatModelKeyOfChatModel, err := newChatModel4(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(NormalChatModel, normalChatModelKeyOfChatModel)
	emotionAndCompanionShipTemplateKeyOfChatTemplate, err := newChatTemplate4(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(EmotionAndCompanionShipTemplate, emotionAndCompanionShipTemplateKeyOfChatTemplate)
	_ = g.AddEdge(compose.START, AnalysisChatTemplate)
	_ = g.AddEdge(NormalChatModel, compose.END)
	_ = g.AddEdge(EmotionAndCompanionChatModel, compose.END)
	_ = g.AddEdge(ToStudyChatModel, compose.END)
	_ = g.AddEdge(ReActLambda, compose.END)
	_ = g.AddEdge(AnalysisChatTemplate, AnalysisChatModel)
	_ = g.AddEdge(EmotionAndCompanionShipLambda, EmotionAndCompanionShipTemplate)
	_ = g.AddEdge(ChatLambda, TaskChatTemplate)
	_ = g.AddEdge(ToStudyLambda, ToStudyChatTemplate)
	_ = g.AddEdge(NormalLambda, NormalChatTemplate)
	_ = g.AddEdge(EmotionAndCompanionShipTemplate, EmotionAndCompanionChatModel)
	_ = g.AddEdge(TaskChatTemplate, ReActLambda)
	_ = g.AddEdge(ToStudyChatTemplate, ToStudyChatModel)
	_ = g.AddEdge(NormalChatTemplate, NormalChatModel)
	_ = g.AddBranch(AnalysisChatModel, compose.NewGraphBranch(newBranch, map[string]bool{EmotionAndCompanionShipLambda: true, ChatLambda: true, ToStudyLambda: true, NormalLambda: true}))
	r, err = g.Compile(ctx, compose.WithGraphName("StudyCoachFor"))
	if err != nil {
		return nil, err
	}
	return r, err
}
