// Package common 提供知识库公共能力：字段常量、Config、索引/集合操作（IndexExists、CreateIndex、DeleteDocument、GetKnowledgeBaseList、SearchDocumentsByIDs）。
// 支持 Elasticsearch 与 Qdrant 双向量存储，通过 Config.Client 或 Config.QdrantClient 选择实现，为 Milvus 等扩展预留接口形态。
package common

const (
	// 文档与向量字段（ES mapping / Qdrant payload 一致）
	FieldContent         = "content"           // 文档正文
	FieldContentVector   = "content_vector"    // 正文向量
	FieldQAContent       = "qa_content"        // QA 生成内容
	FieldQAContentVector = "qa_content_vector" // QA 向量
	FieldCronID          = "cron_id"           // 定时任务 ID
	FieldExtra           = "ext"               // 扩展元数据 JSON
	KnowledgeName        = "_knowledge_name"   // 知识库名称

	RetrieverFieldKey = "_retriever_field" // 检索时指定向量字段（content_vector / qa_content_vector）

	// DocumentsIdKey 用于在 context 中传递文档 ID，供索引流程落库 chunks 使用
	DocumentsIdKey = "_documents_id"

	// IsDeepThinking 深度思考开关，用于 NormalChat 的 ark Thinking
	IsDeepThinking = "_is_deep_thinking"

	Title1 = "h1"
	Title2 = "h2"
	Title3 = "h3"

	ImageURL      = "image_url"      // minio 图片 URL
	ImageVector   = "image_vector"   // 图片向量
	ImageFeatures = "image_features" // 图片特征描述

	XlsxRow = "_row" // Excel 行号
)

var (
	// ExtKeys ext 里面需要存储的数据
	ExtKeys = []string{"_extension", "_file_name", "_source", Title1, Title2, Title3}
)
