package gorm

import (
	"time"
)

// KnowledgeDocuments 知识库文档表，记录每个文档的索引状态
type KnowledgeDocuments struct {
	ID                int64     `gorm:"primaryKey;column:id;autoIncrement"`                    // 主键
	KnowledgeBaseName string    `gorm:"column:knowledge_base_name;type:varchar(255);not null"` // 所属知识库名称
	FileName          string    `gorm:"column:file_name;type:varchar(255)"`                    // 文件名或 URL
	Status            int8      `gorm:"column:status;type:tinyint;not null;default:0"`         // 状态：0 待处理，1 索引中，2 已完成，3 失败
	CreateTime        time.Time `gorm:"column:created_at;type:timestamp;autoCreateTime"`       // 创建时间
	UpdateTime        time.Time `gorm:"column:updated_at;type:timestamp;autoUpdateTime"`       // 更新时间
}

// TableName 设置表名
func (KnowledgeDocuments) TableName() string {
	return "knowledge_documents"
}
