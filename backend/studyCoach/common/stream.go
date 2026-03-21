package common

import (
	"context"
	"io"
	"strings"
	"time"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent"
	"github.com/cloudwego/eino/flow/agent/react"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/google/uuid"
)

// SkillToolDisplayName 根据工具名与 JSON 参数生成展示名（与 SSE tool_status、日志一致），例如 skill(emotion-companion)。
func SkillToolDisplayName(toolName, argumentsJSON string) string {
	if toolName == "skill" && argumentsJSON != "" {
		var m map[string]string
		if err := sonic.Unmarshal([]byte(argumentsJSON), &m); err == nil && m["skill"] != "" {
			return "skill(" + m["skill"] + ")"
		}
	}
	return toolName
}

func toolDisplayName(tc schema.ToolCall) string {
	return SkillToolDisplayName(tc.Function.Name, tc.Function.Arguments)
}

// reasoningChunkSize 思考内容模拟流式时每段最大字符数（按 rune 计，避免截断中文）
const reasoningChunkSize = 4

// reasoningChunkIntervalMs 思考内容每段之间的间隔（毫秒）
const reasoningChunkIntervalMs = 35

// contentChunkSize 回答内容模拟流式时每段最大字符数
const contentChunkSize = 6

// contentChunkIntervalMs 回答内容每段之间的间隔（毫秒）
const contentChunkIntervalMs = 25

type StreamData struct {
	Id               string             `json:"id"`                // 同一个消息里面的id是相同的
	Created          int64              `json:"created"`           // 消息初始生成时间
	Content          string             `json:"content"`           // 消息具体内容
	ReasoningContent string             `json:"reasoning_content"` // 思考过程（深度思考模式）
	Document         []*schema.Document `json:"document"`
}

// ToolStatusData 工具执行状态，用于前端展示「正在执行 XXX」提示
type ToolStatusData struct {
	Tool string `json:"tool"` // 工具名，如 skill、web_search、read_file
	Name string `json:"name"` // 具体操作，如 high-eq-communication、skill 的 skill 参数
}

func SteamResponse(ctx context.Context, streamReader *schema.StreamReader[*schema.Message], docs []*schema.Document) (err error) {
	// 获取HTTP响应对象
	httpReq := ghttp.RequestFromCtx(ctx)
	httpResp := httpReq.Response
	// 设置响应头
	httpResp.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	httpResp.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	httpResp.Header().Set("Pragma", "no-cache")
	httpResp.Header().Set("Expires", "0")
	httpResp.Header().Set("Connection", "keep-alive")
	httpResp.Header().Set("X-Accel-Buffering", "no") // 禁用Nginx缓冲
	httpResp.Header().Set("X-Content-Type-Options", "nosniff")
	httpResp.Header().Set("Access-Control-Allow-Origin", "*")
	httpResp.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	httpResp.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")

	// 立即发送响应头
	httpResp.WriteHeader(200)
	sd := &StreamData{
		Id:      uuid.NewString(),
		Created: time.Now().Unix(),
	}
	if len(docs) > 0 {
		sd.Document = docs
		marshal, _ := sonic.Marshal(sd)
		writeSSEDocuments(httpResp, string(marshal))
	}
	sd.Document = nil // 置空，发一次就够了

	// 用于跟踪已发送的内容长度，实现增量发送
	var fullContent string
	var fullReasoning string

	// 处理流式响应
	for {
		chunk, err := streamReader.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			writeSSEError(httpResp, err)
			break
		}

		hasContent := len(chunk.Content) > 0
		hasReasoning := len(chunk.ReasoningContent) > 0
		hasToolCalls := len(chunk.ToolCalls) > 0

		// 有 ToolCalls 时发送工具执行状态，让前端展示「正在执行 XXX」避免用户以为卡住
		if hasToolCalls {
			for _, tc := range chunk.ToolCalls {
				// 流式 ToolCall 分多个 chunk 推送，后续增量 chunk 的 Name 为空，跳过避免发送空事件
				if tc.Function.Name == "" {
					continue
				}
				displayName := toolDisplayName(tc)
				ts := &ToolStatusData{Tool: tc.Function.Name, Name: displayName}
				if b, _ := sonic.Marshal(ts); len(b) > 0 {
					writeSSEToolStatus(httpResp, string(b))
					httpResp.Flush()
				}
			}
			// 纯工具调用 chunk（无正文内容）：重置累计内容，为下一轮 LLM 回复做准备
			if !hasContent {
				fullContent = ""
				fullReasoning = ""
			}
		}

		if !hasContent && !hasReasoning {
			continue
		}

		var contentToSend string
		var reasoningToSend string

		// 处理 Content（与原有逻辑一致）
		if hasContent {
			if len(chunk.Content) > len(fullContent) && len(fullContent) > 0 {
				if chunk.Content[:len(fullContent)] == fullContent {
					contentToSend = chunk.Content[len(fullContent):]
					fullContent = chunk.Content
				} else {
					contentToSend = chunk.Content
					fullContent += chunk.Content
				}
			} else {
				contentToSend = chunk.Content
				fullContent += chunk.Content
			}
		}

		// 处理 ReasoningContent（思考过程，流式增量）
		if hasReasoning {
			if len(chunk.ReasoningContent) > len(fullReasoning) && len(fullReasoning) > 0 {
				if chunk.ReasoningContent[:len(fullReasoning)] == fullReasoning {
					reasoningToSend = chunk.ReasoningContent[len(fullReasoning):]
					fullReasoning = chunk.ReasoningContent
				} else {
					reasoningToSend = chunk.ReasoningContent
					fullReasoning += chunk.ReasoningContent
				}
			} else {
				reasoningToSend = chunk.ReasoningContent
				fullReasoning += chunk.ReasoningContent
			}
		}

		// 回答内容 / 思考过程：拆成小段模拟流式输出
		if len(contentToSend) > 0 {
			sendSSEStreamed(httpResp, sd, contentToSend, contentChunkSize, contentChunkIntervalMs, streamFieldContent)
		}
		if len(reasoningToSend) > 0 {
			sendSSEStreamed(httpResp, sd, reasoningToSend, reasoningChunkSize, reasoningChunkIntervalMs, streamFieldReasoning)
		}
	}
	// 兜底：若最终内容以「正在...」类过渡句结尾，说明模型可能在工具调用后返回空，追加友好提示
	if fullContent != "" {
		trimmed := strings.TrimSpace(fullContent)
		endsWithEllipsis := strings.HasSuffix(trimmed, "...") || strings.HasSuffix(trimmed, "…")
		hasTransition := strings.Contains(trimmed, "正在检查") || strings.Contains(trimmed, "正在保存") || strings.Contains(trimmed, "让我检查")
		if endsWithEllipsis && hasTransition {
			sendSSEStreamed(httpResp, sd, "处理已完成，可继续对话。", contentChunkSize, contentChunkIntervalMs, streamFieldContent)
			g.Log().Infof(context.Background(), "[Stream] 检测到工具过渡句后流结束，已追加兜底提示")
		}
	}
	// 发送结束事件
	writeSSEDone(httpResp)
	return nil
}

// streamedField 表示本次按 rune 切片写入 StreamData 的字段（正文或思考）。
type streamedField int

const (
	streamFieldContent streamedField = iota
	streamFieldReasoning
)

// sendSSEStreamed 将一段文本按 rune 切分后逐段写入 SSE，模拟打字机流式效果。
// 火山 Ark 等可能一次性返回完整 reasoning_content，此处统一按字符拆分发送。
func sendSSEStreamed(resp *ghttp.Response, sd *StreamData, text string, chunkSize, intervalMs int, field streamedField) {
	runes := []rune(text)
	for i := 0; i < len(runes); i += chunkSize {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunk := string(runes[i:end])
		switch field {
		case streamFieldReasoning:
			sd.ReasoningContent = chunk
			sd.Content = ""
		default: // streamFieldContent
			sd.Content = chunk
			sd.ReasoningContent = ""
		}
		marshal, _ := sonic.Marshal(sd)
		writeSSEData(resp, string(marshal))
		resp.Flush()
		if intervalMs > 0 {
			time.Sleep(time.Duration(intervalMs) * time.Millisecond)
		}
	}
}

// writeSSEData 写入SSE事件
func writeSSEData(resp *ghttp.Response, data string) {
	if len(data) == 0 {
		return
	}
	// 直接写入，避免fmt.Sprintf的开销
	resp.Write([]byte("data:"))
	resp.Write([]byte(data))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

func writeSSEDone(resp *ghttp.Response) {
	resp.Write([]byte("data:[DONE]\n\n"))
	resp.Flush()
}

func writeSSEDocuments(resp *ghttp.Response, data string) {
	resp.Write([]byte("documents:"))
	resp.Write([]byte(data))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

// writeSSEToolStatus 写入工具执行状态事件，前端可展示「正在执行 XXX」
func writeSSEToolStatus(resp *ghttp.Response, data string) {
	if len(data) == 0 {
		return
	}
	resp.Write([]byte("event: tool_status\n"))
	resp.Write([]byte("data:"))
	resp.Write([]byte(data))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

// writeSSEError 写入SSE错误
func writeSSEError(resp *ghttp.Response, err error) {
	g.Log().Error(context.Background(), err)
	resp.Write([]byte("event: error\ndata: "))
	resp.Write([]byte(err.Error()))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

// --- React Agent 流式工具调用（CoachChat / NormalChat 共用）---

// toolCallNotify 工具调用通知，含 Name 与 Arguments，供 toolDisplayName 展示如 skill(emotion-companion)
type toolCallNotify struct {
	Name string
	Args string
}

// toolCallNotifyKey 通过 context 传递工具调用通知 channel 的 key。
type toolCallNotifyKey struct{}

// BuildNotifyMiddleware 返回一个工具中间件，在工具执行前向 ctx 中的通知 channel 发送工具名与参数。
// 若只传 Name 不传 Args，skill 等工具会显示为 "skill" 而非 "skill(emotion-companion)"。
// 如果 channel 已满（缓冲 10），跳过发送以避免阻塞工具执行。
func BuildNotifyMiddleware() compose.ToolMiddleware {
	return compose.ToolMiddleware{
		Invokable: func(next compose.InvokableToolEndpoint) compose.InvokableToolEndpoint {
			return func(ctx context.Context, input *compose.ToolInput) (*compose.ToolOutput, error) {
				display := SkillToolDisplayName(input.Name, input.Arguments)
				g.Log().Infof(context.Background(), "[Stream] 正在执行工具: %s", display)
				if ch, ok := ctx.Value(toolCallNotifyKey{}).(chan toolCallNotify); ok {
					select {
					case ch <- toolCallNotify{Name: input.Name, Args: input.Arguments}:
					default:
					}
				}
				return next(ctx, input)
			}
		},
	}
}

// BuildGenToStream 返回一个 stream 函数，解决 Eino 0.8.4 中 ins.Stream 仅暴露
// 第一轮 LLM 流（Turn 1）、工具执行后 Turn 2 无法到达 SSE 消费者的问题。
//
// 实现：
//   - 用 schema.Pipe 创建活的 StreamReader/StreamWriter 对。
//   - 在 goroutine 中调用 ins.Generate（同步跑完所有工具轮次）。
//   - 工具中间件通过 toolCallNotifyKey channel 实时通知工具调用，
//     通知 goroutine 将其转为带 ToolCalls 的 Message 写入 sw，
//     SteamResponse 会据此发送 tool_status SSE 事件。
//   - Generate 完成后将最终消息写入 sw 并关闭，SSE 层以打字机效果呈现。
//
// 供 CoachChat、NormalChat 等使用 react.Agent 的模块调用。
func BuildGenToStream(ins *react.Agent) func(context.Context, []*schema.Message, ...agent.AgentOption) (*schema.StreamReader[*schema.Message], error) {
	return func(genCtx context.Context, msgs []*schema.Message, opts ...agent.AgentOption) (*schema.StreamReader[*schema.Message], error) {
		sr, sw := schema.Pipe[*schema.Message](20)

		// 工具调用通知 channel：工具中间件写入 Name+Args，供 toolDisplayName 展示如 skill(emotion-companion)
		notifyChan := make(chan toolCallNotify, 10)
		genCtx = context.WithValue(genCtx, toolCallNotifyKey{}, notifyChan)

		go func() {
			defer sw.Close()

			// 通知 goroutine：将工具调用转为带 ToolCalls 的 Message 写入流
			notifyDone := make(chan struct{})
			go func() {
				defer close(notifyDone)
				for n := range notifyChan {
					msg := &schema.Message{
						Role: schema.Assistant,
						ToolCalls: []schema.ToolCall{
							{Function: schema.FunctionCall{Name: n.Name, Arguments: n.Args}},
						},
					}
					if closed := sw.Send(msg, nil); closed {
						for range notifyChan {
						}
						return
					}
				}
			}()

			// 同步跑完所有工具轮次，获取最终回复
			finalMsg, genErr := ins.Generate(genCtx, msgs, opts...)

			// 通知通知 goroutine 结束，等待其写完最后的 tool_status
			close(notifyChan)
			<-notifyDone

			// 将最终回复写入流
			if genErr != nil {
				sw.Send(nil, genErr)
			} else if finalMsg != nil {
				sw.Send(finalMsg, nil)
			}
		}()

		return sr, nil
	}
}

// DrainStreamChecker 读完 LLM 整轮流再决定路由方向，避免默认 firstChunkStreamToolCallChecker
// 在遇到第一个有 Content 的 chunk 就提前返回 false，导致对"先出文字再出 ToolCalls"
// 的模型（如火山方舟）误判为无工具调用。行为与 adk/react.go 的 toolCallCheck 一致。
//
// 供 CoachChat、NormalChat 等使用 react.Agent 的模块作为 StreamToolCallChecker 传入。
func DrainStreamChecker(_ context.Context, sr *schema.StreamReader[*schema.Message]) (bool, error) {
	defer sr.Close()
	hasToolCall := false
	for {
		msg, err := sr.Recv()
		if err != nil {
			if err == io.EOF {
				break
			}
			return false, err
		}
		if len(msg.ToolCalls) > 0 {
			hasToolCall = true
		}
	}
	return hasToolCall, nil
}
