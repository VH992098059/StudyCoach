// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Files is the golang structure for table files.
type Files struct {
	Id             int64       `json:"id"             orm:"id"              description:""` //
	Filename       string      `json:"filename"       orm:"filename"        description:""` //
	Size           float64     `json:"size"           orm:"size"            description:""` //
	ConversationId string      `json:"conversationId" orm:"conversation_id" description:""` //
	CreateAt       *gtime.Time `json:"createAt"       orm:"create_at"       description:""` //
	UpdateAt       *gtime.Time `json:"updateAt"       orm:"update_at"       description:""` //
	DeleteAt       *gtime.Time `json:"deleteAt"       orm:"delete_at"       description:""` //
}
