// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Files is the golang structure for table files.
type Files struct {
	Id             int         `json:"id"             orm:"id"              description:"文件ID"` // 文件ID
	Filename       string      `json:"filename"       orm:"filename"        description:"文件名"`  // 文件名
	Size           float64     `json:"size"           orm:"size"            description:"文件大小"` // 文件大小
	ConversationId string      `json:"conversationId" orm:"conversation_id" description:"对话ID"` // 对话ID
	CreateAt       *gtime.Time `json:"createAt"       orm:"create_at"       description:"创建时间"` // 创建时间
	UpdateAt       *gtime.Time `json:"updateAt"       orm:"update_at"       description:"修改时间"` // 修改时间
	DeleteAt       *gtime.Time `json:"deleteAt"       orm:"delete_at"       description:"软删除"`  // 软删除
}
