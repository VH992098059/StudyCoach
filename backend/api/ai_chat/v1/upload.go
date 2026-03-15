package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// UploadChatFileReq 聊天文件上传请求（multipart/form-data，字段 id + files）
type UploadChatFileReq struct {
	g.Meta `path:"/chat/upload" method:"post" mime:"multipart/form-data" tags:"AI Chat" summary:"上传聊天附件到会话工作目录"`
	Id     string `form:"id" v:"required" dc:"会话ID"`
}

// UploadChatFileRes 聊天文件上传响应
type UploadChatFileRes struct {
	FileNames []string `json:"file_names" dc:"已保存的文件名列表（相对 workdir）"`
}
