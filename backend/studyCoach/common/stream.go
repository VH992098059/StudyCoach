package common

import (
	"context"
	"io"
	"regexp"
	"strings"
	"time"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/google/uuid"
)

// cleanReasoning 过滤推理内容中工具调用相关的 JSON 模式，避免用户在思考区域看到原始 JSON。
// 深度思考模式下模型会在 reasoning_content 中输出 {"name":"skill",...} 等工具调用结构。
var toolCallJSONPattern = regexp.MustCompile(`\{[^{}]*"(?:name|arguments|function|tool|skill|query|file_path|content|command)"[^{}]*\}`)
var emptyJSONPattern = regexp.MustCompile(`\{\s*\}`)

// filterToolCallJSON 过滤工具调用相关的 JSON 片段。
// 注意：不做 TrimSpace！流式增量是按 token 切分的，"\n" 常常独占一个 chunk 或位于 chunk 边界，
// 一旦对增量做 TrimSpace，Markdown 换行会被逐块剥光，导致前端无法渲染标题/列表/段落。
func filterToolCallJSON(text string) string {
	text = toolCallJSONPattern.ReplaceAllString(text, "")
	text = emptyJSONPattern.ReplaceAllString(text, "")
	return text
}

func truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}

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

// 模拟流式输出已移除：模型 token 本身就是渐进到达的，人为拆分+sleep 是纯叠加延迟
// （Windows 下 time.Sleep 精度约 15ms，会成倍放大卡顿），现统一由平滑发送窗口处理。

type StreamData struct {
	Id               string             `json:"id"`
	Created          int64              `json:"created"`
	Content          string             `json:"content"`
	ReasoningContent string             `json:"reasoning_content"` // 深度思考内容
	Document         []*schema.Document `json:"document"`
}

// ToolStatusData 工具执行状态，用于前端展示「正在执行 XXX」提示
type ToolStatusData struct {
	Tool string `json:"tool"` // 工具名，如 skill、web_search、read_file
	Name string `json:"name"` // 具体操作，如 high-eq-communication、skill 的 skill 参数
}

// StageEvent 阶段进度事件，供前端渲染纵向步骤条（event: stage）。
// 通过请求级 ctx 传递的 channel 下发，复用同一条 SSE 连接，不与内容流混。
type StageEvent struct {
	Stage     string `json:"stage"`      // 节点名（compose.WithNodeName）
	Label     string `json:"label"`      // 中文阶段文案
	Status    string `json:"status"`     // start | end | error
	Node      string `json:"node"`       // 节点名（冗余字段，便于前端索引）
	ElapsedMs int64  `json:"elapsed_ms"` // 该阶段耗时（毫秒），end/error 时填充
}

// progressStageKey 通过 context 传递阶段进度 channel 的 key（请求级，避免并发串号）
type progressStageKey struct{}

// WithProgressStage 将阶段进度 channel 注入 ctx
func WithProgressStage(ctx context.Context, ch chan StageEvent) context.Context {
	return context.WithValue(ctx, progressStageKey{}, ch)
}

// ProgressStageFrom 从 ctx 取出阶段进度 channel（未设置时 ok=false）
func ProgressStageFrom(ctx context.Context) (chan StageEvent, bool) {
	ch, ok := ctx.Value(progressStageKey{}).(chan StageEvent)
	return ch, ok
}

// writeSSEStage 写入阶段进度事件，前端可渲染步骤条
func writeSSEStage(resp *ghttp.Response, data string) {
	if len(data) == 0 {
		return
	}
	resp.Write([]byte("event: stage\n"))
	resp.Write([]byte("data:"))
	resp.Write([]byte(data))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

func StreamResponse(ctx context.Context, streamReader *schema.StreamReader[*schema.Message], docs []*schema.Document) (err error) {
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
	// inToolRound 标记当前是否处于工具调用轮次中。
	// 工具调用期间模型输出的 content（如 "{}"）不应发送到前端，等工具执行完毕、
	// 模型生成最终回复后再开始发送 content。
	var inToolRound bool

	// ======================================
	// 平滑发送：合并 smoothInterval 窗口内的增量，批量下发。
	// token 快速到达时批量合并，平滑抖动并降低前端渲染频率；
	// token 缓慢到达时每个增量即时转发，零额外延迟。
	// ======================================
	const smoothInterval = 20 * time.Millisecond
	var pendingContent, pendingReasoning string
	var lastFlush time.Time
	flushPending := func() {
		if len(pendingReasoning) > 0 {
			writeField(httpResp, sd, streamFieldReasoning, pendingReasoning)
			pendingReasoning = ""
		}
		if len(pendingContent) > 0 {
			writeField(httpResp, sd, streamFieldContent, pendingContent)
			pendingContent = ""
		}
		lastFlush = time.Now()
	}

	// ======================================
	// 新增：客户端断开监听 + 心跳保活
	// ======================================
	// 心跳定时器：每15秒发送一次ping，防止长连接被中间节点断开
	heartbeatTicker := time.NewTicker(15 * time.Second)
	defer heartbeatTicker.Stop()

	// 处理协程：监听上下文取消（客户端断开）和心跳
	done := make(chan struct{})
	defer close(done)

	go func() {
		for {
			select {
			case <-ctx.Done():
				// 客户端断开连接，立即关闭streamReader释放资源
				streamReader.Close()
				g.Log().Infof(ctx, "[Stream] 客户端断开连接，已终止流式响应")
				return
			case <-heartbeatTicker.C:
				// 发送心跳ping事件
				writeSSEPing(httpResp)
			case <-done:
				return
			}
		}
	}()

	// 阶段进度消费者：图执行期间 handler 通过 stageChan 推送 StageEvent，
	// handler 在全部节点结束后关闭 channel，本 goroutine 随之退出（无泄漏）。
	if stageChan, ok := ProgressStageFrom(ctx); ok && stageChan != nil {
		go func() {
			for stage := range stageChan {
				if b, _ := sonic.Marshal(stage); len(b) > 0 {
					writeSSEStage(httpResp, string(b))
				}
			}
		}()
	}

	// 处理流式响应
	for {
		select {
		case <-ctx.Done():
			// 客户端断开，直接返回
			return ctx.Err()
		default:
		}

		chunk, err := streamReader.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			// 错误脱敏处理，不泄露内部信息
			g.Log().Error(ctx, "流式响应错误：", err)
			writeSSEError(httpResp, gerror.NewCode(gcode.New(500, "响应生成失败，请稍后重试", nil)))
			break
		}

		hasContent := len(chunk.Content) > 0
		hasReasoning := len(chunk.ReasoningContent) > 0
		hasToolCalls := len(chunk.ToolCalls) > 0

		g.Log().Infof(ctx, "[Stream] Chunk - Content:%q, Reasoning:%q, ToolCalls:%d, inToolRound:%v",
			truncate(chunk.Content, 50), truncate(chunk.ReasoningContent, 50), len(chunk.ToolCalls), inToolRound)

		// 有 ToolCalls 时发送工具执行状态，让前端展示「正在执行 XXX」避免用户以为卡住
		if hasToolCalls {
			inToolRound = true
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
			// 工具调用 chunk 中的 content 是 LLM 推理文本（如 "{I need to use tool}"），
			// 不应发送到前端显示，始终重置累计内容
			fullContent = ""
			fullReasoning = ""
			continue
		}

		// 工具调用轮次结束后，首个无 ToolCalls 的 content chunk = 最终回复，开始正常发送
		if inToolRound && hasContent {
			inToolRound = false
			fullContent = ""
			fullReasoning = ""
		}

		// 工具调用轮次中的中间内容（无 ToolCalls 但非最终回复）不发送
		if inToolRound {
			continue
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

		// 思考过程优先渲染：增量先过滤、入缓冲，窗口到期批量下发
		if len(reasoningToSend) > 0 {
			pendingReasoning += filterToolCallJSON(reasoningToSend) // 增量不做 TrimSpace，保留换行
		}
		if len(contentToSend) > 0 {
			pendingContent += filterToolCallJSON(contentToSend) // 增量不做 TrimSpace，保留换行
		}
		if (len(pendingReasoning) > 0 || len(pendingContent) > 0) && time.Since(lastFlush) >= smoothInterval {
			flushPending()
		}
	}
	flushPending() // 流结束兜底：发出未满窗口的剩余增量
	// 兜底：若最终内容以「正在...」类过渡句结尾，说明模型可能在工具调用后返回空，追加友好提示
	if fullContent != "" {
		trimmed := strings.TrimSpace(fullContent)
		endsWithEllipsis := strings.HasSuffix(trimmed, "...") || strings.HasSuffix(trimmed, "…")
		hasTransition := strings.Contains(trimmed, "正在检查") || strings.Contains(trimmed, "正在保存") || strings.Contains(trimmed, "让我检查")
		if endsWithEllipsis && hasTransition {
			writeField(httpResp, sd, streamFieldContent, "处理已完成，可继续对话。")
			g.Log().Infof(context.Background(), "[Stream] 检测到工具过渡句后流结束，已追加兜底提示")
		}
	}
	// 发送结束事件
	writeSSEDone(httpResp)
	return nil
}

// streamedField 表示本次写入 StreamData 的字段（正文或思考）。
type streamedField int

const (
	streamFieldContent streamedField = iota
	streamFieldReasoning
)

// writeField 填充 StreamData 对应字段并写入一条 SSE 事件
func writeField(resp *ghttp.Response, sd *StreamData, field streamedField, chunk string) {
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
// writeSSEPing 发送心跳ping事件，保持长连接存活
func writeSSEPing(resp *ghttp.Response) {
	resp.Write([]byte("event: ping\ndata: {}\n\n"))
	resp.Flush()
}

func writeSSEError(resp *ghttp.Response, err error) {
	g.Log().Error(context.Background(), err)
	// 错误脱敏，只返回错误码和友好提示
	errMsg := err.Error()
	if gerror.Code(err).Code() >= 500 {
		errMsg = "服务暂时不可用，请稍后重试"
	}
	resp.Write([]byte("event: error\ndata: "))
	resp.Write([]byte(errMsg))
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

// BuildNotifyMiddleware 返回工具中间件，通过 channel 通知工具执行。
// 仅 Name 时显示为 "skill"；Name+Args 时显示为 "skill(emotion-companion)"。
// 缓冲已满（10）时跳过，避免阻塞。
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

// DrainStreamChecker 等待完整流再判断工具调用，避免误判"先文字后工具"的模型（如部分 Claude 版本）。
// 缺点：分支路由必须等整轮流结束，最终回复轮退化为"整轮生成完才转发"，观感等同假流式。
// OpenAI 兼容模型（如 doubao）请改用 FastStreamChecker。
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

// FastStreamChecker 首个有效 chunk 即判断的工具调用检查器：
//   - 首个带 ToolCalls 的 chunk → 工具调用轮，立即路由执行工具（几乎零等待）
//   - 首个带 Content 的 chunk  → 最终回复轮，立即放行，后续 token 直通输出（真流式）
//   - 跳过 role-only/空 delta，避免部分模型首块为空导致误判
//
// 依据：OpenAI 兼容流式协议中 tool_calls 与 content 不会在同一 chunk 竞争先行，
// doubao 的工具调用 chunk 亦为独立到达（日志佐证：ToolCalls chunk 的 Content 恒为空）。
// 注意：对"先输出一段文字再调用工具"的模型不适用，那类模型请用 DrainStreamChecker。
func FastStreamChecker(_ context.Context, sr *schema.StreamReader[*schema.Message]) (bool, error) {
	defer sr.Close()
	for {
		msg, err := sr.Recv()
		if err != nil {
			if err == io.EOF {
				return false, nil
			}
			return false, err
		}
		if msg == nil {
			continue
		}
		if len(msg.ToolCalls) > 0 {
			return true, nil
		}
		if msg.Content != "" || len(msg.MultiContent) > 0 {
			return false, nil
		}
	}
}
