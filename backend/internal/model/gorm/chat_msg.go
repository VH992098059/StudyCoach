package gorm

import "time"

// ChatMsgs 聊天会话表（chat-history 风格）
type ChatMsgs struct {
	ID        string    `gorm:"primaryKey;type:varchar(32)"`                                       // 主键，会话唯一 ID
	Title     string    `gorm:"type:varchar(255);not null"`                                        // 会话标题
	UserUUID  string    `gorm:"type:varchar(255);not null;index:user_uuid;index:idx_user_updated"` // 所属用户 UUID
	CreatedAt time.Time `gorm:"type:datetime;not null"`                                            // 创建时间
	UpdatedAt time.Time `gorm:"type:datetime;not null"`                                            // 更新时间
}

// TableName 指定表名
func (ChatMsgs) TableName() string {
	return "chat_msgs"
}
