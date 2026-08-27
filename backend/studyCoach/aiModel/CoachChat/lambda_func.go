package CoachChat

import (
	"backend/studyCoach/common"
	"context"
	"fmt"
	"github.com/gogf/gf/v2/frame/g"

	"github.com/cloudwego/eino/schema"
)

// resolveOriginalQuestion 返回用户的原始问题。
// 上游输入是 AnalysisChatModel 的意图分析报告（内部中间件数据），不能当作用户问题传给下游模板；
// 原始问题由请求级 context 经 WithRouteInput 注入，仅在未注入时回退到上游消息内容。
func resolveOriginalQuestion(ctx context.Context, fallback string) string {
	if ri, ok := RouteInputFrom(ctx); ok && ri.Question != "" {
		return ri.Question
	}
	return fallback
}

// newLambda component initialization function of node 'EmotionAndCompanionShipLambda' in graph 'StudyCoachFor'
func buildEmotionCompanionLambda(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("EmotionAndCompanionShipLambda input message is nil")
	}
	g.Log().Infof(ctx, "EmotionAndCompanionShipLambda 处理消息: %s", input.Content)
	//获取内容
	output = common.GetSafeTemplateParams()
	output["question"] = resolveOriginalQuestion(ctx, input.Content)
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	output["current_time"] = common.GetCurrentTimeString()
	g.Log().Info(ctx, "EmotionAndCompanionShipLambda已处理消息")
	return output, nil
}

// newLambda1 component initialization function of node 'ChatLambda' in graph 'StudyCoachFor'
func buildTaskStudyLambda(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("ChatLambda input message is nil")
	}
	g.Log().Infof(ctx, "ChatLambda 处理消息: %s", input.Content)
	//获取内容
	output = common.GetSafeTemplateParams()
	output["question"] = resolveOriginalQuestion(ctx, input.Content)
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	output["current_time"] = common.GetCurrentTimeString()
	g.Log().Info(ctx, "ChatLambda已处理消息")
	return output, nil
}

// newLambda2 PlanModifyLambda：修改、增加、删除现有计划
func buildPlanModifyLambda(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("PlanModifyLambda input message is nil")
	}
	output = common.GetSafeTemplateParams()
	output["question"] = resolveOriginalQuestion(ctx, input.Content)
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	output["current_time"] = common.GetCurrentTimeString()
	g.Log().Infof(ctx, "PlanModifyLambda 已处理消息")
	return output, nil
}
