package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type AiChatReq struct {
	g.Meta         `path:"/chat" method:"post"`
	ID             string   `json:"id" v:"required"` // 会话id
	Question       string   `json:"question" v:"required"`
	KnowledgeName  string   `json:"knowledge_name"`
	TopK           int      `json:"top_k"` // 默认为5
	Score          float64  `json:"score"` // 默认为0.2
	IsNetwork      bool     `json:"is_network"`
	IsStudyMode    bool     `json:"is_study_mode"`
	IsDeepThinking bool     `json:"is_deep_thinking"` // 深度思考（仅 NormalChat 生效）
	UploadedFiles  []string `json:"uploaded_files"`   // 本轮已上传到会话工作目录的文件名列表，供 AI 用 read_file 读取
}
type AiChatRes struct {
	g.Meta `mime:"text/event-stream"`
}
