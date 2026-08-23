package CoachChat

import (
	"context"

	"github.com/cloudwego/eino/schema"
)

// routeInputKey 是分支路由输入的类型化 context key，取代原先 "question"/"chat_history" 魔法字符串（P2）。
type routeInputKey struct{}

// RouteInput 承载分支判断所需的问题与对话历史，由调用方在请求级 context 注入。
type RouteInput struct {
	Question    string
	ChatHistory []*schema.Message
}

// WithRouteInput 将路由输入注入 context（类型安全，避免字符串 key 冲突与跨包漂移）。
func WithRouteInput(ctx context.Context, question string, history []*schema.Message) context.Context {
	return context.WithValue(ctx, routeInputKey{}, RouteInput{Question: question, ChatHistory: history})
}

// RouteInputFrom 从 context 取出路由输入；ok=false 表示调用方未注入（应降级到 input.Content）。
func RouteInputFrom(ctx context.Context) (RouteInput, bool) {
	v, ok := ctx.Value(routeInputKey{}).(RouteInput)
	return v, ok
}
