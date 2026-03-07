package gorm

import "time"

// DocumentVectors 文档向量表，存储用于 RAG 检索的文本片段及其向量
type DocumentVectors struct {
	ID         string    `gorm:"primaryKey;column:id;type:varchar(255)"` // 主键，通常为 chunk_id 或文档片段唯一标识
	Content    string    `gorm:"column:content;type:text"`               // 原始文本内容
	Vector     string    `gorm:"column:vector;type:longtext"`            // 向量化后的 embedding，JSON 或序列化格式
	Metadata   string    `gorm:"column:metadata;type:text"`              // 扩展元数据（JSON），如来源、知识库等
	SourceType string    `gorm:"column:source_type;type:varchar(50)"`    // 来源类型（如 url、file、api 等）
	CreatedAt  time.Time `gorm:"column:created_at;type:datetime"`        // 创建时间
	UpdatedAt  time.Time `gorm:"column:updated_at;type:datetime"`        // 更新时间
}

func (DocumentVectors) TableName() string {
	return "document_vectors"
}
