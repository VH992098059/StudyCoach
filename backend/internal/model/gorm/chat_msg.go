package gorm

import "time"

// ChatMsgs 聊天会话表模型
type ChatMsgs struct {
	ID        string    `gorm:"primaryKey;type:varchar(32)"`
	Title     string    `gorm:"type:varchar(255);not null"`
	UserUUID  string    `gorm:"type:varchar(255);not null;index:user_uuid;index:idx_user_updated"`
	CreatedAt time.Time `gorm:"type:datetime;not null"`
	UpdatedAt time.Time `gorm:"type:datetime;not null"`
}

// TableName 指定表名
func (ChatMsgs) TableName() string {
	return "chat_msgs"
}
