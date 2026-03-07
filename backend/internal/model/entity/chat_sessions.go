// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// ChatSessions is the golang structure for table chat_sessions.
type ChatSessions struct {
	Id        int64       `json:"id"        orm:"id"         description:""` //
	Uuid      string      `json:"uuid"      orm:"uuid"       description:""` //
	UserId    string      `json:"userId"    orm:"user_id"    description:""` //
	Title     string      `json:"title"     orm:"title"      description:""` //
	CreatedAt *gtime.Time `json:"createdAt" orm:"created_at" description:""` //
	UpdatedAt *gtime.Time `json:"updatedAt" orm:"updated_at" description:""` //
}
