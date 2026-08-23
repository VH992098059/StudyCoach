package gorm

import "time"

// ChatSessions 聊天会话表
type ChatSessions struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"` // 主键（UUID）
	UserID    string    `gorm:"column:user_id;type:uuid;index"`                 // 所属用户 ID（users.id）
	Title     string    `gorm:"column:title;type:varchar(255)"`                 // 会话标题
	CreatedAt time.Time `gorm:"column:created_at;type:timestamp"`               // 创建时间
	UpdatedAt time.Time `gorm:"column:updated_at;type:timestamp"`               // 更新时间
}

func (ChatSessions) TableName() string {
	return "chat_sessions"
}
