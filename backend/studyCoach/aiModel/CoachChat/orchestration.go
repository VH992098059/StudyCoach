package CoachChat

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildstudyCoachFor(ctx context.Context, conf *common.Config) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		AnalysisChatTemplate            = "AnalysisChatTemplate"
		AnalysisChatModel               = "AnalysisChatModel"
		EmotionAndCompanionShipLambda   = "EmotionAndCompanionShipLambda"
		TaskStudyLambda                 = "TaskStudyLambda"
		StudyLambda                     = "StudyLambda"
		EmotionAndCompanionChatModel    = "EmotionAndCompanionChatModel"
		TaskChatTemplate                = "TaskChatTemplate"
		ReActLambda                     = "ReActLambda"
		ToStudyChatTemplate             = "ToStudyChatTemplate"
		EmotionAndCompanionShipTemplate = "EmotionAndCompanionShipTemplate"
		ToStudyChatModel                = "ToStudyChatModel"
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
	_ = g.AddLambdaNode(TaskStudyLambda, compose.InvokableLambda(newLambda1))
	_ = g.AddLambdaNode(StudyLambda, compose.InvokableLambda(newLambda2))
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
	reActLambdaKeyOfLambda, err := newLambda3(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(ReActLambda, reActLambdaKeyOfLambda)
	toStudyChatTemplateKeyOfChatTemplate, err := newChatTemplate2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(ToStudyChatTemplate, toStudyChatTemplateKeyOfChatTemplate)
	emotionAndCompanionShipTemplateKeyOfChatTemplate, err := newChatTemplate3(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(EmotionAndCompanionShipTemplate, emotionAndCompanionShipTemplateKeyOfChatTemplate)
	toStudyChatModelKeyOfLambda, err := newLambda4(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(ToStudyChatModel, toStudyChatModelKeyOfLambda)
	_ = g.AddEdge(compose.START, AnalysisChatTemplate)
	_ = g.AddEdge(EmotionAndCompanionChatModel, compose.END)
	_ = g.AddEdge(ReActLambda, compose.END)
	_ = g.AddEdge(ToStudyChatModel, compose.END)
	_ = g.AddEdge(AnalysisChatTemplate, AnalysisChatModel)
	_ = g.AddEdge(EmotionAndCompanionShipLambda, EmotionAndCompanionShipTemplate)
	_ = g.AddEdge(TaskStudyLambda, TaskChatTemplate)
	_ = g.AddEdge(StudyLambda, ToStudyChatTemplate)
	_ = g.AddEdge(EmotionAndCompanionShipTemplate, EmotionAndCompanionChatModel)
	_ = g.AddEdge(TaskChatTemplate, ReActLambda)
	_ = g.AddEdge(ToStudyChatTemplate, ToStudyChatModel)
	_ = g.AddBranch(AnalysisChatModel, compose.NewGraphBranch(newBranch, map[string]bool{EmotionAndCompanionShipLambda: true, TaskStudyLambda: true, StudyLambda: true}))
	r, err = g.Compile(ctx, compose.WithGraphName("StudyCoachFor"))
	if err != nil {
		return nil, err
	}
	return r, err
}
