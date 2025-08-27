package gorm

import (
	"time"
)

// KnowledgeBase GORM模型定义
type KnowledgeBase struct {
	ID          int64     `gorm:"primaryKey;column:id"`
	Name        string    `gorm:"column:name;type:varchar(255);not null"`
	Description string    `gorm:"column:description;type:varchar(500)"`
	Category    string    `gorm:"column:category;type:varchar(100)"`
	Status      int       `gorm:"column:status;default:1;not null"`
	CreatedAt   time.Time `gorm:"column:created_at;type:timestamp with time zone;default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `gorm:"column:updated_at;type:timestamp with time zone;default:CURRENT_TIMESTAMP"`
}

// TableName 设置表名
func (KnowledgeBase) TableName() string {
	return "knowledge_base"
}
