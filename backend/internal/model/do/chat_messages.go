// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// ChatMessages is the golang structure of table chat_messages for DAO operations like Where/Data.
type ChatMessages struct {
	g.Meta           `orm:"table:chat_messages, do:true"`
	Id               any         //
	SessionUuid      any         //
	MsgId            any         //
	Content          any         //
	MultiContent     any         //
	IsUser           any         //
	Timestamp        *gtime.Time //
	ReasoningContent any         //
}
