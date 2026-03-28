// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// ChatMessages is the golang structure for table chat_messages.
type ChatMessages struct {
	Id               int64       `json:"id"               orm:"id"                description:""` //
	SessionUuid      string      `json:"sessionUuid"      orm:"session_uuid"      description:""` //
	MsgId            string      `json:"msgId"            orm:"msg_id"            description:""` //
	Content          string      `json:"content"          orm:"content"           description:""` //
	MultiContent     string      `json:"multiContent"     orm:"multi_content"     description:""` //
	IsUser           int         `json:"isUser"           orm:"is_user"           description:""` //
	Timestamp        *gtime.Time `json:"timestamp"        orm:"timestamp"         description:""` //
	ReasoningContent string      `json:"reasoningContent" orm:"reasoning_content" description:""` //
}
