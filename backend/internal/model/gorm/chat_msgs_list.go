package gorm

import "time"

// ChatMsgsList 聊天消息列表表（chat-history 风格）
type ChatMsgsList struct {
	ID             int64     `gorm:"primaryKey;autoIncrement"`                               // 主键
	ConversationID string    `gorm:"type:varchar(255);not null"`                             // 所属会话 ID
	MsgID          string    `gorm:"type:varchar(64);not null;uniqueIndex:uk_msg_id"`        // 消息唯一 ID
	ChatID         string    `gorm:"type:varchar(255);not null;index:fk_msgsList_user_uuid"` // 用户/会话关联 ID
	Content        string    `gorm:"type:text;not null"`                                     // 消息内容
	Role           string    `gorm:"type:enum('user','system','assistant');not null"`        // 角色：user 用户、system 系统、assistant AI
	CreatedAt      time.Time `gorm:"type:datetime;not null"`                                 // 创建时间
	TokenCount     int       `gorm:"type:int;default:null"`                                  // 消息 token 数量（用于计费或统计）
}

// TableName 指定表名
func (ChatMsgsList) TableName() string {
	return "chat_msgs_list"
}
