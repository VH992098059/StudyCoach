package CoachChat

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/cloudwego/eino/schema"
)

// newBranch branch initialization method of node 'AnalysisChatModel' in graph 'studyCoachFor'
// 使用原始用户问题做路由，而非意图分析的 TOON 输出，确保 Branch 能正确识别「修改计划」「加番茄钟」等语义
func newBranch(ctx context.Context, input *schema.Message) (endNode string, err error) {
	content := ""
	if q := ctx.Value("question"); q != nil {
		if s, ok := q.(string); ok && s != "" {
			content = strings.ToLower(s)
		}
	}
	if content == "" {
		content = strings.ToLower(input.Content)
	}
	log.Printf("[newBranch] 开始分支判断 (question=%s)", content)
	log.Println("AnalysisChatModel分支输出")
	param := map[string]interface{}{
		"question":     content,
		"chat_history": ctx.Value("chat_history"),
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
	log.Printf("[newBranch] 分支判断完成 - 结果: %s", generate.Content)
	log.Println("Branch结果分析为：", generate.Content)
	return generate.Content, nil
}
