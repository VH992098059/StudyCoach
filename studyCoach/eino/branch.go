package eino

import (
	"context"
	"fmt"
	"github.com/cloudwego/eino/schema"
	"log"
	"os"
	"strings"
)

// newBranch branch initialization method of node 'AnalysisChatModel' in graph 'studyCoachFor'
func newBranch(ctx context.Context, input *schema.Message) (endNode string, err error) {
	content := strings.ToLower(input.Content)
	log.Println("AnalysisChatModel分支输出")
	param := map[string]interface{}{
		"question": content,
	}
	model, err := BranchNewChatModel(ctx)
	if err != nil {
		return "", fmt.Errorf("AnalysisChatModel的Branch出错：%w", err)
	}
	template, err := BranchChatTemplate(ctx)
	if err != nil {
		return "", err
	}
	format, err := template.Format(ctx, param)
	if err != nil {
		return "", err
	}
	generate, err := model.Generate(ctx, format)
	if err != nil {
		return "", err
	}
	log.Println("Branch结果分析为：", generate.Content)
	return generate.Content, nil
}

// newBranch1 branch initialization method of node 'studyLambda' in graph 'studyCoachFor'
func newBranch1(ctx context.Context, input any) (endNode string, err error) {
	if os.Getenv("ES_ENABLED") == "true" {
		return "StudyRetriever", nil
	}
	return "NoEsLambda", nil
}
