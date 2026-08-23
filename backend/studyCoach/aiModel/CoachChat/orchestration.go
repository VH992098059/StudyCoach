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

	analysisChatTemplateKeyOfChatTemplate, err := buildIntentAnalysisTemplate(ctx)
	if err != nil {
		return nil, err
	}
	if err := g.AddChatTemplateNode(AnalysisChatTemplate, analysisChatTemplateKeyOfChatTemplate); err != nil {
		return nil, err
	}

	analysisChatModelKeyOfChatModel, err := buildIntentAnalysisModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	if err := g.AddChatModelNode(AnalysisChatModel, analysisChatModelKeyOfChatModel); err != nil {
		return nil, err
	}

	if err := g.AddLambdaNode(EmotionAndCompanionShipLambda, compose.InvokableLambda(buildEmotionCompanionLambda)); err != nil {
		return nil, err
	}
	if err := g.AddLambdaNode(TaskStudyLambda, compose.InvokableLambda(buildTaskStudyLambda)); err != nil {
		return nil, err
	}
	if err := g.AddLambdaNode(PlanModifyLambda, compose.InvokableLambda(buildPlanModifyLambda)); err != nil {
		return nil, err
	}

	emotionAndCompanionChatModelKeyOfChatModel, err := buildEmotionCompanionModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	if err := g.AddChatModelNode(EmotionAndCompanionChatModel, emotionAndCompanionChatModelKeyOfChatModel); err != nil {
		return nil, err
	}

	taskChatTemplateKeyOfChatTemplate, err := buildTaskStudyTemplate(ctx)
	if err != nil {
		return nil, err
	}
	if err := g.AddChatTemplateNode(TaskChatTemplate, taskChatTemplateKeyOfChatTemplate); err != nil {
		return nil, err
	}

	reActLambdaKeyOfLambda, err := buildReActAgent(ctx, conf)
	if err != nil {
		return nil, err
	}
	if err := g.AddLambdaNode(ReActLambda, reActLambdaKeyOfLambda); err != nil {
		return nil, err
	}

	planModifyTemplateKeyOfChatTemplate, err := buildPlanModifyTemplate(ctx)
	if err != nil {
		return nil, err
	}
	if err := g.AddChatTemplateNode(PlanModifyTemplate, planModifyTemplateKeyOfChatTemplate); err != nil {
		return nil, err
	}

	emotionAndCompanionShipTemplateKeyOfChatTemplate, err := buildEmotionCompanionTemplate(ctx)
	if err != nil {
		return nil, err
	}
	if err := g.AddChatTemplateNode(EmotionAndCompanionShipTemplate, emotionAndCompanionShipTemplateKeyOfChatTemplate); err != nil {
		return nil, err
	}

	planModifyModelKeyOfLambda, err := buildPlanModifyModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	if err := g.AddLambdaNode(PlanModifyModel, planModifyModelKeyOfLambda); err != nil {
		return nil, err
	}

	if err := g.AddEdge(compose.START, AnalysisChatTemplate); err != nil {
		return nil, err
	}
	if err := g.AddEdge(EmotionAndCompanionChatModel, compose.END); err != nil {
		return nil, err
	}
	if err := g.AddEdge(ReActLambda, compose.END); err != nil {
		return nil, err
	}
	if err := g.AddEdge(PlanModifyModel, compose.END); err != nil {
		return nil, err
	}
	if err := g.AddEdge(AnalysisChatTemplate, AnalysisChatModel); err != nil {
		return nil, err
	}
	if err := g.AddEdge(EmotionAndCompanionShipLambda, EmotionAndCompanionShipTemplate); err != nil {
		return nil, err
	}
	if err := g.AddEdge(TaskStudyLambda, TaskChatTemplate); err != nil {
		return nil, err
	}
	if err := g.AddEdge(PlanModifyLambda, PlanModifyTemplate); err != nil {
		return nil, err
	}
	if err := g.AddEdge(EmotionAndCompanionShipTemplate, EmotionAndCompanionChatModel); err != nil {
		return nil, err
	}
	if err := g.AddEdge(TaskChatTemplate, ReActLambda); err != nil {
		return nil, err
	}
	if err := g.AddEdge(PlanModifyTemplate, PlanModifyModel); err != nil {
		return nil, err
	}
	if err := g.AddBranch(AnalysisChatModel, compose.NewGraphBranch(newBranch, map[string]bool{EmotionAndCompanionShipLambda: true, TaskStudyLambda: true, PlanModifyLambda: true})); err != nil {
		return nil, err
	}

	r, err = g.Compile(ctx, compose.WithGraphName("StudyCoachFor"))
	if err != nil {
		return nil, err
	}
	return r, nil
}
