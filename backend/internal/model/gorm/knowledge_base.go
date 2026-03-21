package gorm

import (
	"time"
)

// KnowledgeBase 知识库表
type KnowledgeBase struct {
	ID          int64     `gorm:"primaryKey;column:id"`                                                                    // 主键
	UserUUID    string    `gorm:"column:user_uuid;type:varchar(64);not null;default:'';uniqueIndex:idx_kb_user_uuid_name"` // 所属用户（users.uuid）
	Name        string    `gorm:"column:name;type:varchar(255);uniqueIndex:idx_kb_user_uuid_name"`                         // 知识库名称（同一用户下唯一）
	Description string    `gorm:"column:description;type:varchar(255)"`                                                    // 描述
	Category    string    `gorm:"column:category;type:varchar(255)"`                                                       // 分类
	Status      int       `gorm:"column:status;default:1"`                                                                 // 状态：1 启用
	CreateTime  time.Time `gorm:"column:created_at"`                                                                       // 创建时间
	UpdateTime  time.Time `gorm:"column:updated_at"`                                                                       // 更新时间
}

// TableName 设置表名
func (KnowledgeBase) TableName() string {
	return "knowledge_base"
}
