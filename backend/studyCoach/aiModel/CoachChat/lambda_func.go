package CoachChat

import (
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"

	"github.com/cloudwego/eino/schema"
)

// newLambda component initialization function of node 'EmotionAndCompanionShipLambda' in graph 'StudyCoachFor'
func newLambda(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("EmotionAndCompanionShipLambda input message is nil")
	}
	log.Printf("EmotionAndCompanionShipLambda 处理消息: %s", input.Content)
	//获取内容
	output = common.GetSafeTemplateParams()
	output["question"] = input.Content
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	output["current_time"] = common.GetCurrentTimeString()
	log.Println("EmotionAndCompanionShipLambda已处理消息")
	return output, nil
}

// newLambda1 component initialization function of node 'ChatLambda' in graph 'StudyCoachFor'
func newLambda1(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("ChatLambda input message is nil")
	}
	log.Printf("ChatLambda 处理消息: %s", input.Content)
	//获取内容
	output = common.GetSafeTemplateParams()
	output["question"] = input.Content
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	output["current_time"] = common.GetCurrentTimeString()
	log.Println("ChatLambda已处理消息")
	return output, nil
}

// newLambda2 PlanModifyLambda：修改、增加、删除现有计划
func newLambda2(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("PlanModifyLambda input message is nil")
	}
	output = common.GetSafeTemplateParams()
	output["question"] = input.Content
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	output["current_time"] = common.GetCurrentTimeString()
	log.Println("PlanModifyLambda 已处理消息")
	return output, nil
}
