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
		PlanModifyLambda                = "PlanModifyLambda" // 修改、增加、删除现有计划
		EmotionAndCompanionChatModel    = "EmotionAndCompanionChatModel"
		TaskChatTemplate                = "TaskChatTemplate"
		ReActLambda                     = "ReActLambda"
		PlanModifyTemplate              = "PlanModifyTemplate"
		EmotionAndCompanionShipTemplate = "EmotionAndCompanionShipTemplate"
		PlanModifyModel                 = "PlanModifyModel"
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
	_ = g.AddLambdaNode(PlanModifyLambda, compose.InvokableLambda(newLambda2))
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
	planModifyTemplateKeyOfChatTemplate, err := newChatTemplate2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(PlanModifyTemplate, planModifyTemplateKeyOfChatTemplate)
	emotionAndCompanionShipTemplateKeyOfChatTemplate, err := newChatTemplate3(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(EmotionAndCompanionShipTemplate, emotionAndCompanionShipTemplateKeyOfChatTemplate)
	planModifyModelKeyOfLambda, err := newLambda4(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(PlanModifyModel, planModifyModelKeyOfLambda)
	_ = g.AddEdge(compose.START, AnalysisChatTemplate)
	_ = g.AddEdge(EmotionAndCompanionChatModel, compose.END)
	_ = g.AddEdge(ReActLambda, compose.END)
	_ = g.AddEdge(PlanModifyModel, compose.END)
	_ = g.AddEdge(AnalysisChatTemplate, AnalysisChatModel)
	_ = g.AddEdge(EmotionAndCompanionShipLambda, EmotionAndCompanionShipTemplate)
	_ = g.AddEdge(TaskStudyLambda, TaskChatTemplate)
	_ = g.AddEdge(PlanModifyLambda, PlanModifyTemplate)
	_ = g.AddEdge(EmotionAndCompanionShipTemplate, EmotionAndCompanionChatModel)
	_ = g.AddEdge(TaskChatTemplate, ReActLambda)
	_ = g.AddEdge(PlanModifyTemplate, PlanModifyModel)
	_ = g.AddBranch(AnalysisChatModel, compose.NewGraphBranch(newBranch, map[string]bool{EmotionAndCompanionShipLambda: true, TaskStudyLambda: true, PlanModifyLambda: true}))
	r, err = g.Compile(ctx, compose.WithGraphName("StudyCoachFor"))
	if err != nil {
		return nil, err
	}
	return r, err
}
