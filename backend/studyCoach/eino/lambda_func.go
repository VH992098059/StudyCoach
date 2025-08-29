package eino

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
	output = common.TemplateParams
	log.Printf("EmotionAndCompanionShipLambda 处理消息: %s", input.Content)
	output["question"] = input.Content
	//log.Printf("生成模板变量: %+v", output["chat_history"])
	log.Println("EmotionAndCompanionShipLambda已处理消息")
	return output, nil
}

// newLambda1 component initialization function of node 'ChatLambda' in graph 'StudyCoachFor'
func newLambda1(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("ChatLambda input message is nil")
	}
	output = common.TemplateParams
	log.Printf("ChatLambda 处理消息: %s", input.Content)
	output["question"] = input.Content
	//log.Printf("生成模板变量: %+v", output["chat_history"])
	log.Println("ChatLambda已处理消息")
	return output, nil
}

// newLambda2 component initialization function of node 'ToStudyLambda' in graph 'StudyCoachFor'
func newLambda2(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("ToStudyLambda input message is nil")
	}
	templateParams := common.TemplateParams
	templateParams["question"] = input.Content
	log.Println("ToStudyLambda不使用Es搜索引擎分支内容输出")
	return templateParams, nil
}

// newLambda3 component initialization function of node 'NormalLambda' in graph 'StudyCoachFor'
func newLambda3(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
	if input == nil {
		return nil, fmt.Errorf("NormalLambda input message is nil")
	}
	NormalTemplateParams := common.NormalTemplateParams
	NormalTemplateParams["question"] = input.Content
	return NormalTemplateParams, nil
}
