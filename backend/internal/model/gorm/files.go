package gorm

import "time"

// Files 文件表，存储聊天会话中的附件
type Files struct {
	ID             int        `gorm:"primaryKey;column:id;autoIncrement"`             // 主键
	Filename       string     `gorm:"column:filename;type:varchar(255)"`              // 文件名
	Size           float64    `gorm:"column:size;type:double"`                        // 文件大小（字节）
	ConversationID string     `gorm:"column:conversation_id;type:varchar(255);index"` // 所属会话 ID
	CreateAt       *time.Time `gorm:"column:create_at;type:datetime"`                 // 创建时间
	UpdateAt       *time.Time `gorm:"column:update_at;type:datetime"`                 // 更新时间
	DeleteAt       *time.Time `gorm:"column:delete_at;type:datetime;index"`           // 软删除时间
}

func (Files) TableName() string {
	return "files"
}
