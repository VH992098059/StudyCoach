package v1

import (
	"encoding/json"

	"github.com/gogf/gf/v2/frame/g"
)

type MessagePart struct {
	Type       string `json:"type"` // "text" 或 "image_url"
	Text       string `json:"text,omitempty"`
	ImageURL   string `json:"image_url,omitempty"`   // 图片 URL
	Base64Data string `json:"base64_data,omitempty"` // 图片 base64
	MIMEType   string `json:"mime_type,omitempty"`   // 如 "image/jpeg"
}

// GetMultiContent 安全解析 MultiContent，过滤无效数据
func (r *AiChatReq) GetMultiContent() []MessagePart {
	if len(r.MultiContentRaw) == 0 {
		return nil
	}
	var parts []MessagePart
	if err := json.Unmarshal(r.MultiContentRaw, &parts); err != nil {
		return nil
	}
	return parts
}

type AiChatReq struct {
	g.Meta          `path:"/chat" method:"post"`
	ID              string          `json:"id" v:"required"` // 会话id
	Question        string          `json:"question"`        // 纯文本问题（兼容旧版）
	MultiContentRaw json.RawMessage `json:"multi_content"`   // 多模态内容原始数据
	KnowledgeName   string          `json:"knowledge_name"`
	TopK            int             `json:"top_k"` // 默认为5
	Score           float64         `json:"score"` // 默认为0.2
	IsNetwork       bool            `json:"is_network"`
	IsStudyMode     bool            `json:"is_study_mode"`
	IsDeepThinking  bool            `json:"is_deep_thinking"` // 深度思考（仅 NormalChat 生效）
	UploadedFiles   []string        `json:"uploaded_files"`   // 本轮已上传到会话工作目录的文件名列表，供 AI 用 read_file 读取
}
type AiChatRes struct {
	g.Meta `mime:"text/event-stream"`
}
