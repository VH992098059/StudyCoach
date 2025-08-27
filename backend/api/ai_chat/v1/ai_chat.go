package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type AiChatReq struct {
	g.Meta        `path:"/chat" method:"post"`
	ID            string  `json:"id" v:"required"` // 会话id
	Question      string  `json:"question" v:"required"`
	KnowledgeName string  `json:"knowledge_name"`
	TopK          int     `json:"top_k"` // 默认为5
	Score         float64 `json:"score"` // 默认为0.2
	IsNetwork     bool    `json:"is_network"`
}
type AiChatRes struct {
	g.Meta `mime:"text/event-stream"`
}
