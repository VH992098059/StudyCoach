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
	g.Meta         `orm:"table:chat_sessions, do:true"`
	Id             interface{} // 会话ID，主键
	UserId         interface{} // 用户ID，外键关联users表
	ConversationId interface{} // 对话ID，关联chat_history.messages表的conversation_id
	Title          interface{} // 会话标题，默认为"新对话"
	CreatedAt      *gtime.Time // 会话创建时间
	UpdatedAt      *gtime.Time // 会话最后更新时间
	MessageCount   interface{} // 消息数量，冗余字段便于快速查询
	IsDeleted      interface{} // 软删除标记：0-正常，1-已删除
}
