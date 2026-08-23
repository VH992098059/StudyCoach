package gorm

import "time"

// Files 文件表，存储聊天会话中的附件
type Files struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"` // 主键（UUID）
	Filename       string     `gorm:"column:filename;type:varchar(255)"`              // 文件名
	Size           float64    `gorm:"column:size;type:double precision"`              // 文件大小（字节）
	ConversationID string     `gorm:"column:conversation_id;type:uuid;index"`         // 所属会话 ID（chat_sessions.id）
	CreateAt       *time.Time `gorm:"column:create_at;type:timestamp"`                // 创建时间
	UpdateAt       *time.Time `gorm:"column:update_at;type:timestamp"`                // 更新时间
	DeleteAt       *time.Time `gorm:"column:delete_at;type:timestamp;index"`          // 软删除时间
}

func (Files) TableName() string {
	return "files"
}
