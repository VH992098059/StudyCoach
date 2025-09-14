package eino

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/cloudwego/eino/schema"
)

// newBranch branch initialization method of node 'AnalysisChatModel' in graph 'studyCoachFor'
func newBranch(ctx context.Context, input *schema.Message) (endNode string, err error) {
	// 为分支判断添加15秒超时控制
	branchCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	content := strings.ToLower(input.Content)
	log.Printf("[newBranch] 开始分支判断")
	log.Println("AnalysisChatModel分支输出")
	param := map[string]interface{}{
		"question": content,
	}
	model, err := BranchNewChatModel(branchCtx)
	if err != nil {
		return "", fmt.Errorf("AnalysisChatModel的Branch出错：%w", err)
	}
	template, err := BranchChatTemplate(branchCtx)
	if err != nil {
		return "", err
	}
	format, err := template.Format(branchCtx, param)
	if err != nil {
		return "", err
	}
	generate, err := model.Generate(branchCtx, format)
	if err != nil {
		return "", err
	}
	log.Printf("[newBranch] 分支判断完成 - 结果: %s", generate.Content)
	log.Println("Branch结果分析为：", generate.Content)
	return generate.Content, nil
}
