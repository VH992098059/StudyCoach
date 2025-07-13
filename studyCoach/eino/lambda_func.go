package eino

import (
	"context"
	"fmt"
	"log"
	"strings"
	"studyCoach/studyCoach/common"

	"github.com/cloudwego/eino/schema"
)

// newLambda component initialization function of node 'studyLambda' in graph 'studyCoachFor'
func newLambda(ctx context.Context, input []*schema.Message, opts ...any) (output string, err error) {
	if len(input) == 0 {
		return "", fmt.Errorf("studyLambda input message slice is empty")
	}
	var content string
	for _, v := range input {
		content = v.Content
	}
	log.Println("studyLambda输出内容")
	doc := &schema.Message{
		Role:    schema.User,
		Content: content,
	}
	return doc.Content, nil
}

// newLambda1 component initialization function of node 'ResourceTidyLambda' in graph 'studyCoachFor'
func newLambda1(ctx context.Context, input []*schema.Message, opts ...any) (output []*schema.Document, err error) {
	panic("implement me")
}

// newLambda3 component initialization function of node 'CompanionShipLambda' in graph 'studyCoachFor'
func newLambda3(ctx context.Context, input *schema.Message, opts ...any) (output *schema.Message, err error) {
	log.Println(input.Content)
	model, err := EmotionChatModel(ctx)
	if err != nil {
		return nil, fmt.Errorf("newLambda3出错：%w", err)
	}
	param := common.TemplateParams
	param["question"] = input.Content
	template, err := EmotionAndCompanionShipTemplate(ctx)
	if err != nil {
		return nil, err
	}
	format, err := template.Format(ctx, param)
	if err != nil {
		return nil, err
	}
	generate, err := model.Generate(ctx, format)
	if err != nil {
		return nil, err
	}
	log.Println("CompanionShipLambda结果分析为：", generate.Content)
	return generate, nil
}

// newLambda4 component initialization function of node 'OutputLambda' in graph 'studyCoachFor'
func newLambda4(ctx context.Context, input *schema.Message) (output *schema.Message, err error) {
	if input == nil {
		return nil, fmt.Errorf("OutputLambda input message is nil")
	}
	var processedContent string
	processedContent = fmt.Sprintf("\n\n%s", input.Content)
	outputMessage := &schema.Message{
		Role:    schema.Assistant,
		Content: processedContent,
	}
	log.Println("OutputLambda已输出内容")

	return outputMessage, nil
}

// newLambda5 component initialization function of node 'OutputResourceTidyLambda' in graph 'studyCoachFor'
func newLambda5(ctx context.Context, input []string) (output *schema.Message, err error) {
	panic("implement me")
}

// newLambda6 component initialization function of node 'EsToReActLambda' in graph 'studyCoachFor'
func newLambda6(ctx context.Context, input []*schema.Document, opts ...any) (output []*schema.Message, err error) {
	if len(input) == 0 {
		return nil, fmt.Errorf("no documents provided")
	}
	var knowledgeContent strings.Builder
	knowledgeContent.WriteString("以下是相关的学习资源和知识：\n\n")
	for i, doc := range input {
		knowledgeContent.WriteString(fmt.Sprintf("资源%d:\n", i+1))
		knowledgeContent.WriteString(doc.Content)
		knowledgeContent.WriteString("\n\n")
	}
	log.Println("EsToReActLambda输出内容：", knowledgeContent.String())
	messages := []*schema.Message{
		{
			Role:    schema.User,
			Content: knowledgeContent.String(),
		},
	}
	return messages, nil
}

// newLambda7 component initialization function of node 'ChatLambda' in graph 'studyCoachFor'
func newLambda7(ctx context.Context, input *schema.Message) (output map[string]any, err error) {
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

// newLambda8 component initialization function of node 'NoEsLambda' in graph 'studyCoachFor'
func newLambda8(ctx context.Context, input string, opts ...any) (output []*schema.Message, err error) {
	if input == "" {
		return nil, fmt.Errorf("NoEsLambda input message is nil")
	}

	templateParams := common.TemplateParams
	role := templateParams["role"].(string)
	style := templateParams["style"].(string)
	chatHistory := templateParams["chat_history"]
	var messages []*schema.Message
	// 如果有聊天历史，先添加历史消息
	if chatHistory != nil {
		if historyMessages, ok := chatHistory.([]*schema.Message); ok {
			messages = append(messages, historyMessages...)
		}
	}
	processedContent := fmt.Sprintf(
		"作为%s，我以%s的风格为您回复：\n\n%s",
		role, style, input,
	)
	messages = append(messages, &schema.Message{
		Role:    schema.User,
		Content: processedContent,
	})
	log.Println("不使用Es搜索引擎分支内容输出")
	return messages, nil
}

// newLambda9 component initialization function of node 'ToStudyLambda' in graph 'studyCoachFor'
func newLambda9(ctx context.Context, input *schema.Message) (output []*schema.Message, err error) {
	if input == nil {
		return nil, fmt.Errorf("NoEsLambda input message is nil")
	}

	templateParams := common.TemplateParams
	role := templateParams["role"].(string)
	style := templateParams["style"].(string)
	chatHistory := templateParams["chat_history"]
	var messages []*schema.Message
	// 如果有聊天历史，先添加历史消息
	if chatHistory != nil {
		if historyMessages, ok := chatHistory.([]*schema.Message); ok {
			messages = append(messages, historyMessages...)
		}
	}
	processedContent := fmt.Sprintf(
		"作为%s，我以%s的风格为您回复：\n\n%s",
		role, style, input,
	)
	messages = append(messages, &schema.Message{
		Role:    schema.User,
		Content: processedContent,
	})
	log.Println("不使用Es搜索引擎分支内容输出")
	return messages, nil
}
