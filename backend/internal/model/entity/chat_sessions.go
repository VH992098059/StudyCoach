// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// ChatSessions is the golang structure for table chat_sessions.
type ChatSessions struct {
	Id             int64       `json:"id"             orm:"id"              description:"会话ID，主键"`                                       // 会话ID，主键
	UserId         int64       `json:"userId"         orm:"user_id"         description:"用户ID，外键关联users表"`                               // 用户ID，外键关联users表
	ConversationId string      `json:"conversationId" orm:"conversation_id" description:"对话ID，关联chat_history.messages表的conversation_id"` // 对话ID，关联chat_history.messages表的conversation_id
	Title          string      `json:"title"          orm:"title"           description:"会话标题，默认为\"新对话\""`                               // 会话标题，默认为"新对话"
	CreatedAt      *gtime.Time `json:"createdAt"      orm:"created_at"      description:"会话创建时间"`                                        // 会话创建时间
	UpdatedAt      *gtime.Time `json:"updatedAt"      orm:"updated_at"      description:"会话最后更新时间"`                                      // 会话最后更新时间
	MessageCount   int         `json:"messageCount"   orm:"message_count"   description:"消息数量，冗余字段便于快速查询"`                               // 消息数量，冗余字段便于快速查询
	IsDeleted      int         `json:"isDeleted"      orm:"is_deleted"      description:"软删除标记：0-正常，1-已删除"`                              // 软删除标记：0-正常，1-已删除
}
