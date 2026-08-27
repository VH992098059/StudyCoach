// Package session 提供轻量的对话历史持久化，替代第三方 chat-history 依赖。
//
// 设计依据（重构计划 §10）：Eino 官方不提供持久化记忆组件（Memory/Session/Store
// 是业务层概念，参考实现为 eino-examples 的 JSONL 文件存储）。本项目原用
// wangle201210/chat-history（依赖 gorm/sqlite 的 CGO 链，导致本机 go build 需要 gcc）。
// 这里用项目自管的文件存储实现等价能力，且为纯 Go，消除 CGO 阻塞。
//
// 多租户：当前按 convID 分文件存储；阶段三 P9 将把 user_id 作为目录前缀一并收口，
// 使跨用户无法越权读取彼此历史。
package session

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
)

// History 对话历史存储，API 与 chat-history 的 eino.History 保持一致：
//   - SaveMessage(mess, convID) 追加一条消息
//   - GetHistory(convID, limit) 返回最近 limit 条（按时间正序，供 LLM 上下文）
type History struct {
	dir string
	mu  sync.Mutex
}

// NewFileHistory 以 dir 作为历史根目录构造文件存储实例。
func NewFileHistory(dir string) *History {
	return &History{dir: dir}
}

func (h *History) pathFor(convID string) string {
	return filepath.Join(h.dir, fmt.Sprintf("%s.jsonl", convID))
}

// sanitizeForLLMHistory 将消息裁剪为「作为 LLM 上下文安全」的形态。
//
// 根因修复：ReAct 流式输出经 ConcatMessages 拼接后，assistant 消息可能残留
// tool_calls（其 id/type 为空字符串，来自工具调用中间产物）。这类消息下一轮作为
// chat_history 发给 OpenAI 兼容服务时，tool_calls[].type 不满足 "function" 字面量
// 校验，SiliconFlow 直接 400 "Input should be a valid string"（code 20015）。
// 历史上下文只需 role + content（+用户多模态输入），其余协议字段一律丢弃。
func sanitizeForLLMHistory(m *schema.Message) *schema.Message {
	if m == nil {
		return nil
	}
	role := schema.RoleType(strings.TrimSpace(string(m.Role)))
	switch role {
	case schema.User, schema.Assistant, schema.System, schema.Tool:
	default:
		// 非法/未知角色统一按 assistant 兜底，避免下游严格校验拒绝
		role = schema.Assistant
	}
	return &schema.Message{
		Role:                  role,
		Content:               m.Content,
		MultiContent:          m.MultiContent,
		UserInputMultiContent: m.UserInputMultiContent,
	}
}

// SaveMessage 将一条消息追加写入 convID 对应的 JSONL 文件。
// 写入前先清洗（见 sanitizeForLLMHistory），保证落盘数据即为 LLM 安全形态。
func (h *History) SaveMessage(mess *schema.Message, convID string) error {
	if mess == nil {
		return nil
	}
	mess = sanitizeForLLMHistory(mess)
	h.mu.Lock()
	defer h.mu.Unlock()

	if err := os.MkdirAll(h.dir, 0o755); err != nil {
		return fmt.Errorf("mkdir chat history dir %q: %w", h.dir, err)
	}
	f, err := os.OpenFile(h.pathFor(convID), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return fmt.Errorf("open chat history file: %w", err)
	}
	defer f.Close()

	line, err := json.Marshal(mess)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}
	if _, err := f.Write(append(line, '\n')); err != nil {
		return fmt.Errorf("write chat history: %w", err)
	}
	return nil
}

// GetHistory 读取 convID 最近 limit 条消息（按时间正序）。limit<=0 时取最近 100 条。
func (h *History) GetHistory(convID string, limit int) ([]*schema.Message, error) {
	if limit <= 0 {
		limit = 100
	}
	data, err := os.ReadFile(h.pathFor(convID))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read chat history: %w", err)
	}

	msgs := make([]*schema.Message, 0, limit)
	for _, line := range splitLines(data) {
		if len(line) == 0 {
			continue
		}
		var m schema.Message
		if err := json.Unmarshal(line, &m); err != nil {
			g.Log().Warningf(gctx.GetInitCtx(), "skip corrupted chat history line in conv %s: %v", convID, err)
			continue
		}
		// 读取侧兜底清洗：历史文件里可能已存在带 tool_calls/空 id 的脏数据
		//（清洗逻辑上线前落盘），避免下一轮请求发给 LLM 时触发 4xx 校验错误。
		msgs = append(msgs, sanitizeForLLMHistory(&m))
	}

	if len(msgs) > limit {
		msgs = msgs[len(msgs)-limit:]
	}
	return msgs, nil
}

// Delete 删除某个会话的全部历史（对齐 ChatBase.DeleteSession 的清理语义）。
func (h *History) Delete(convID string) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	err := os.Remove(h.pathFor(convID))
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// TruncateKeep 将 convID 的历史截断为前 keepCount 条（供编辑重发/重新生成回滚上下文）。
// 通过临时文件 + rename 原子替换，避免中途崩溃留下半截文件；
// keepCount 超过现有条数时为幂等 no-op；历史文件不存在时返回 (0, nil)。
func (h *History) TruncateKeep(convID string, keepCount int) (int, error) {
	if keepCount < 0 {
		keepCount = 0
	}
	h.mu.Lock()
	defer h.mu.Unlock()

	path := h.pathFor(convID)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, fmt.Errorf("read chat history: %w", err)
	}

	// 过滤空行后的有效消息行
	var lines [][]byte
	for _, line := range splitLines(data) {
		if len(line) == 0 {
			continue
		}
		lines = append(lines, line)
	}
	if keepCount >= len(lines) {
		return len(lines), nil
	}

	var out []byte
	for _, line := range lines[:keepCount] {
		out = append(out, line...)
		out = append(out, '\n')
	}

	tmp, err := os.CreateTemp(h.dir, convID+".trunc-*")
	if err != nil {
		return 0, fmt.Errorf("create temp file for truncate: %w", err)
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName) // rename 成功后此调用无害（文件已不存在）
	if _, err := tmp.Write(out); err != nil {
		tmp.Close()
		return 0, fmt.Errorf("write truncated history: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return 0, fmt.Errorf("close temp file: %w", err)
	}
	if err := os.Rename(tmpName, path); err != nil {
		return 0, fmt.Errorf("replace chat history file: %w", err)
	}
	return keepCount, nil
}

func splitLines(b []byte) [][]byte {
	var out [][]byte
	start := 0
	for i, c := range b {
		if c == '\n' {
			out = append(out, b[start:i])
			start = i + 1
		}
	}
	if start < len(b) {
		out = append(out, b[start:])
	}
	return out
}
