// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ChatSessions is the golang structure of table chat_sessions for DAO operations like Where/Data.
type ChatSessions struct {
	g.Meta    `orm:"table:chat_sessions, do:true"`
	Id        any         //
	Uuid      any         //
	UserId    any         //
	Title     any         //
	CreatedAt *gtime.Time //
	UpdatedAt *gtime.Time //
}
