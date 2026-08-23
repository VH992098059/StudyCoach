package CoachChat

import (
	"context"
	"sync"
	"time"

	"backend/studyCoach/common"
	"github.com/cloudwego/eino/callbacks"
)

// stageLabels 将 Eino 图节点名映射为前端步骤条的中文文案。
// 键名为 orchestration.go 中 Add*Node 注册的节点名（局部 const，此处用字面量对齐）；
// 阶段二（P1）节点重命名后需同步更新此处。
var stageLabels = map[string]string{
	"AnalysisChatTemplate":            "分析意图",
	"AnalysisChatModel":               "意图识别模型",
	"EmotionAndCompanionShipLambda":   "情感陪伴应答",
	"TaskStudyLambda":                 "学习任务应答",
	"PlanModifyLambda":                "计划修订应答",
	"EmotionAndCompanionChatModel":    "情感陪伴生成",
	"TaskChatTemplate":                "学习任务提示词",
	"ReActLambda":                     "工具调用与推理",
	"PlanModifyTemplate":              "计划修订提示词",
	"EmotionAndCompanionShipTemplate": "情感陪伴提示词",
	"PlanModifyModel":                 "计划修订生成",
	// NormalChat 路径节点（无专属文案时使用节点名兜底）
	"NormalChatTemplate": "闲聊提示词",
	"NormalChatModel":    "闲聊生成",
}

// label 返回节点中文文案，未知节点回退为原始节点名，保证步骤条始终有内容。
func label(node string) string {
	if l, ok := stageLabels[node]; ok {
		return l
	}
	return node
}

// progressHandler 基于 Eino 节点级回调（请求级，非全局）上报阶段进度。
// 通过 pending 计数在所有节点 OnEnd 后关闭 stageChan，使 StreamResponse 的消费者 goroutine 退出。
type progressHandler struct {
	sessionID string
	ch        chan<- common.StageEvent
	mu        sync.Mutex
	closed    bool
	pending   int
	starts    map[string]time.Time
}

// NewProgressHandler 构造请求级进度回调 Handler。
// sessionID 用于日志；ch 为阶段事件下发 channel（建议缓冲 ≥32）。
// 调用方通过 compose.WithCallbacks(handler) 挂载到本次 graph.Stream，避免并发串号。
func NewProgressHandler(sessionID string, ch chan<- common.StageEvent) callbacks.Handler {
	h := &progressHandler{
		sessionID: sessionID,
		ch:        ch,
		starts:    map[string]time.Time{},
	}
	return callbacks.NewHandlerBuilder().
		OnStartFn(func(ctx context.Context, info *callbacks.RunInfo, _ callbacks.CallbackInput) context.Context {
			h.mu.Lock()
			h.pending++
			h.starts[info.Name] = time.Now()
			h.mu.Unlock()
			h.send(common.StageEvent{
				Stage:  info.Name,
				Label:  label(info.Name),
				Status: "start",
				Node:   info.Name,
			})
			return ctx
		}).
		OnEndFn(func(ctx context.Context, info *callbacks.RunInfo, _ callbacks.CallbackOutput) context.Context {
			h.onFinish(info.Name, "end", nil)
			return ctx
		}).
		OnErrorFn(func(ctx context.Context, info *callbacks.RunInfo, runErr error) context.Context {
			h.onFinish(info.Name, "error", runErr)
			return ctx
		}).
		Build()
}

// send 非阻塞下发阶段事件，避免消费者未及时读取时阻塞图执行。
// 用 mu + closed 标志保护：channel 关闭后静默丢弃，避免图出错时 eino 回调时序不保证
// 导致的 "send on closed channel" panic。
func (h *progressHandler) send(ev common.StageEvent) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.ch == nil || h.closed {
		return
	}
	select {
	case h.ch <- ev:
	default:
	}
}

// onFinish 节点结束时下发 end/error 事件，并在全部节点结束后关闭 channel。
func (h *progressHandler) onFinish(node, status string, runErr error) {
	h.mu.Lock()
	elapsed := int64(0)
	if t, ok := h.starts[node]; ok {
		elapsed = time.Since(t).Milliseconds()
	}
	h.pending--
	if h.pending < 0 {
		h.pending = 0
	}
	done := h.pending == 0
	h.mu.Unlock()

	lb := label(node)
	if status == "error" {
		lb = lb + " (失败)"
	}
	h.send(common.StageEvent{
		Stage:     node,
		Label:     lb,
		Status:    status,
		Node:      node,
		ElapsedMs: elapsed,
	})
	if done {
		h.closeChannel()
	}
}

// closeChannel 幂等关闭下发 channel（mu + closed 标志保证只关一次，且与 send 互斥），
// 避免 "close of closed channel" panic。
func (h *progressHandler) closeChannel() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.closed || h.ch == nil {
		return
	}
	h.closed = true
	close(h.ch)
}
