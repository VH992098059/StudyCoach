package common

import (
	"context"
	"fmt"

	"github.com/cloudwego/eino/components/tool"
	"github.com/gogf/gf/v2/frame/g"
)

// ToolSearchFallbackHint 搜索类工具失败时返回给模型的降级提示。
// 明确要求模型不要反复重试，基于已有知识作答，避免拖垮响应时间。
const ToolSearchFallbackHint = "网络搜索工具暂时不可用（可能被搜索引擎限流或网络异常）。" +
	"请勿再次调用该工具，直接基于你已有的知识回答用户，并适当提示该信息可能不是最新的。"

// faultTolerantTool 工具容错包装：执行失败时把降级提示作为文本结果返回给模型，
// 而不是向上抛错导致整个 ReAct 流程 NodeRunError（触发全图重试，工具仍会失败，纯属浪费等待时间）。
// 典型场景：DuckDuckGo 反爬返回 202，重试也大概率失败，不如让模型降级回答。
type faultTolerantTool struct {
	tool.InvokableTool
	errHint string
}

func (f *faultTolerantTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	res, err := f.InvokableTool.InvokableRun(ctx, argumentsInJSON, opts...)
	if err == nil {
		return res, nil
	}
	g.Log().Warningf(ctx, "[Tool] 工具执行失败，降级为文本结果: %v", err)
	return fmt.Sprintf("%s\n错误信息: %v", f.errHint, err), nil
}

// WrapToolFallback 包装 InvokableTool：执行失败时返回 errHint 文本而非 error，保证对话流程不中断。
func WrapToolFallback(t tool.InvokableTool, errHint string) tool.InvokableTool {
	return &faultTolerantTool{InvokableTool: t, errHint: errHint}
}
