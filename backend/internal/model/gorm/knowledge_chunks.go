package gorm

import (
	"time"
)

// KnowledgeChunks 知识块表，存储文档切片后的文本片段
type KnowledgeChunks struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`             // 主键（UUID）
	KnowledgeDocID string    `gorm:"column:knowledge_doc_id;type:uuid;not null;index"`           // 所属文档 ID（knowledge_documents.id）
	ChunkID        string    `gorm:"column:chunk_id;type:uuid;not null;uniqueIndex:uk_chunk_id"` // 切片唯一 ID（UUID）
	Content        string    `gorm:"column:content;type:text"`                                   // 切片文本内容
	Ext            string    `gorm:"column:ext;type:varchar(1024)"`                              // 扩展信息（JSON），如位置、元数据等
	Status         int8      `gorm:"column:status;type:smallint;not null;default:1"`             // 状态：1 正常
	CreateTime     time.Time `gorm:"column:created_at;type:timestamp;autoCreateTime"`            // 创建时间
	UpdateTime     time.Time `gorm:"column:updated_at;type:timestamp;autoUpdateTime"`            // 更新时间

	KnowledgeDocument KnowledgeDocuments `gorm:"foreignKey:KnowledgeDocID;references:ID;constraint:OnDelete:CASCADE,OnUpdate:RESTRICT"` // 关联文档
}

// TableName 设置表名
func (KnowledgeChunks) TableName() string {
	return "knowledge_chunks"
}
