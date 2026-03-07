// Package common 提供 RAG 知识库的公共配置与向量存储抽象。
package common

import (
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/milvus-io/milvus/client/v2/milvusclient"
	"github.com/qdrant/go-client/qdrant"
)

// VectorEngine 向量引擎类型
const (
	VectorEngineES     = "es"
	VectorEngineQdrant = "qdrant"
	VectorEngineMilvus = "milvus"
)

// Config 知识库向量存储的统一配置。
// VectorEngine 指定引擎：es(默认)、qdrant、milvus。对应 Client 非空时生效。
type Config struct {
	VectorEngine string // es(默认) | qdrant | milvus

	Client       *elasticsearch.Client      // ES 客户端
	QdrantClient *qdrant.Client             // Qdrant 客户端
	MilvusClient *milvusclient.Client       // Milvus 客户端
	MilvusConfig *milvusclient.ClientConfig // Milvus 连接配置（Client 为空时用于创建）

	IndexName string // ES index / Qdrant collection / Milvus collection 名

	// Embedding 相关
	APIKey         string
	BaseURL        string
	EmbeddingModel string
	ChatModel      string
}

// UseMilvus 判断是否使用 Milvus 引擎
func (c *Config) UseMilvus() bool {
	return c.VectorEngine == VectorEngineMilvus && (c.MilvusClient != nil || c.MilvusConfig != nil)
}

// UseQdrant 判断是否使用 Qdrant 引擎
func (c *Config) UseQdrant() bool {
	return c.QdrantClient != nil && (c.VectorEngine == "" || c.VectorEngine == VectorEngineQdrant)
}

// UseES 判断是否使用 ES 引擎（默认）
func (c *Config) UseES() bool {
	return c.Client != nil && (c.VectorEngine == "" || c.VectorEngine == VectorEngineES)
}

// Copy 深拷贝 Config，用于多协程或分支逻辑中避免共享修改。
func (c *Config) Copy() *Config {
	return &Config{
		VectorEngine:   c.VectorEngine,
		Client:         c.Client,
		QdrantClient:   c.QdrantClient,
		MilvusClient:   c.MilvusClient,
		MilvusConfig:   c.MilvusConfig,
		IndexName:      c.IndexName,
		APIKey:         c.APIKey,
		BaseURL:        c.BaseURL,
		EmbeddingModel: c.EmbeddingModel,
		ChatModel:      c.ChatModel,
	}
}
