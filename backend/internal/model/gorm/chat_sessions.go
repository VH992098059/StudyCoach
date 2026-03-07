package gorm

import "time"

// ChatSessions 聊天会话表
type ChatSessions struct {
	ID        int64     `gorm:"primaryKey;column:id;autoIncrement"`     // 主键
	UUID      string    `gorm:"column:uuid;type:varchar(255);index"`    // 会话唯一标识
	UserID    string    `gorm:"column:user_id;type:varchar(255);index"` // 所属用户 ID
	Title     string    `gorm:"column:title;type:varchar(255)"`         // 会话标题
	CreatedAt time.Time `gorm:"column:created_at;type:datetime"`        // 创建时间
	UpdatedAt time.Time `gorm:"column:updated_at;type:datetime"`        // 更新时间
}

func (ChatSessions) TableName() string {
	return "chat_sessions"
}
