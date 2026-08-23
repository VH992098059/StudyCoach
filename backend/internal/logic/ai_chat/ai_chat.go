package ai_chat

import (
	"sync"
)

// ChatBase 会话管理服务。其方法（SaveSession/GetHistory/GetSession/DeleteSession/MergeAnonymousSessions）
// 均只依赖 dao 与 session 存储，无内部状态，故为零字段结构体。
type ChatBase struct{}

var (
	chat     *ChatBase
	chatOnce sync.Once
)

// NewChatBase 构造会话服务实例。
func NewChatBase() *ChatBase {
	return &ChatBase{}
}

// GetChat 返回全局唯一的会话服务实例。
// 采用懒加载（sync.Once）初始化，避免此前 chat 从未赋值导致的恒 nil 缺陷（调用方直接 NPE）。
// 更彻底的构造注入（删除全局单例、由 cmd.go 注入 controller）留待阶段三运行时验证后推进。
func GetChat() *ChatBase {
	chatOnce.Do(func() {
		chat = NewChatBase()
	})
	return chat
}
