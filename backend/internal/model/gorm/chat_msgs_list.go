package gorm

import "time"

// ChatMsgsList 消息表模型
type ChatMsgsList struct {
	ID             int64     `gorm:"primaryKey;autoIncrement"`
	ConversationID string    `gorm:"type:varchar(255);not null"`
	MsgID          string    `gorm:"type:varchar(64);not null;uniqueIndex:uk_msg_id"`
	ChatID         string    `gorm:"type:varchar(255);not null;index:fk_msgsList_user_uuid"`
	Content        string    `gorm:"type:text;not null"`
	Role           string    `gorm:"type:enum('user','system','assistant');not null"`
	CreatedAt      time.Time `gorm:"type:datetime;not null"`
	TokenCount     int       `gorm:"type:int;default:null"`
}

// TableName 指定表名
func (ChatMsgsList) TableName() string {
	return "chat_msgs_list"
}
