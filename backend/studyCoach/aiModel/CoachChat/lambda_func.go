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
	log.Println("ChatLambda已处理消息")
	return output, nil
}

// newLambda2 component initialization function of node 'ToStudyLambda' in graph 'StudyCoachFor'
func newLambda2(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("ToStudyLambda input message is nil")
	}
	//获取内容
	output = common.GetSafeTemplateParams()
	output["question"] = input.Content
	output["chat_history"] = ctx.Value("chat_history")
	output["knowledge"] = ctx.Value("knowledge")
	log.Println("ToStudyLambda不使用Es搜索引擎分支内容输出")
	return output, nil
}
