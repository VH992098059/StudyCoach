package CoachChat

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/cloudwego/eino/schema"
)

// newBranch 路由分支：使用原始问题而非意图分析结果，确保识别「修改计划」等语义
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
