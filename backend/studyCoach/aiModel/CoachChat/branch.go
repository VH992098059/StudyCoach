package CoachChat

import (
	"context"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

// 分支路由的合法终点节点（与 orchestration.go 中 AddBranch 的 endNodes 保持一致）。
const (
	RouteEmotion = "EmotionAndCompanionShipLambda"
	RouteTask    = "TaskStudyLambda"
	RoutePlan    = "PlanModifyLambda"
)

// fallbackRoute 非法/失败时的兜底分支：功能最完整，保证用户始终有可用回答。
const fallbackRoute = RouteTask

var validRoutes = map[string]bool{
	RouteEmotion: true,
	RouteTask:    true,
	RoutePlan:    true,
}

// branchMaxRetries 路由模型调用失败时的重试次数（非逻辑错误，如超时/限流）。
const branchMaxRetries = 2

// 以下变量用于依赖注入，便于单测；生产环境走默认实现。
var (
	branchTemplateFn = BranchChatTemplate
	branchClassifyFn = func(ctx context.Context, msgs []*schema.Message) (string, error) {
		cm, err := BranchNewChatModel(ctx)
		if err != nil {
			return "", fmt.Errorf("AnalysisChatModel的Branch出错：%w", err)
		}
		gen, err := cm.Generate(ctx, msgs)
		if err != nil {
			return "", err
		}
		return gen.Content, nil
	}
)

// newBranch 路由分支：使用原始问题而非意图分析结果，确保识别「修改计划」等语义。
func newBranch(ctx context.Context, input *schema.Message) (endNode string, err error) {
	question := input.Content
	if ri, ok := RouteInputFrom(ctx); ok && ri.Question != "" {
		question = ri.Question
	}
	question = strings.ToLower(question)
	g.Log().Infof(ctx, "[newBranch] 开始分支判断 question=%s", question)

	chatHistory, _ := RouteInputFrom(ctx)
	param := map[string]any{
		"question":     question,
		"chat_history": chatHistory.ChatHistory,
	}
	template, err := branchTemplateFn(ctx)
	if err != nil {
		return "", err
	}
	format, err := template.Format(ctx, param)
	if err != nil {
		return "", err
	}
	raw, err := classifyWithRetry(ctx, format)
	if err != nil {
		g.Log().Errorf(ctx, "[newBranch] 路由模型连续 %d 次失败，兜底 %s: %v", branchMaxRetries, fallbackRoute, err)
		return fallbackRoute, nil
	}
	endNode = normalizeRoute(raw)
	if !validRoutes[endNode] {
		g.Log().Warningf(ctx, "[newBranch] 非法路由输出 %q，兜底 %s", raw, fallbackRoute)
		return fallbackRoute, nil
	}
	g.Log().Infof(ctx, "[newBranch] 分支判断完成 - 结果: %s", endNode)
	return endNode, nil
}

// classifyWithRetry 调用路由模型，失败重试；全部失败返回最后一次错误。
func classifyWithRetry(ctx context.Context, msgs []*schema.Message) (string, error) {
	var lastErr error
	for i := 0; i < branchMaxRetries; i++ {
		raw, err := branchClassifyFn(ctx, msgs)
		if err == nil {
			return raw, nil
		}
		lastErr = err
		g.Log().Warningf(ctx, "[newBranch] 路由模型第 %d/%d 次调用失败: %v", i+1, branchMaxRetries, err)
	}
	return "", lastErr
}

// normalizeRoute 清洗模型输出（去引号/代码围栏/首尾空白），便于与白名单比对。
func normalizeRoute(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.Trim(s, "`\"'")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}
