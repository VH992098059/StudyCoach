// Package qdrant 提供基于 Qdrant 的向量索引实现（含命名向量写入）。
package qdrant

import (
	"context"
	"fmt"

	einoqdrant "github.com/cloudwego/eino-ext/components/indexer/qdrant"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	qdrantclient "github.com/qdrant/go-client/qdrant"
)

// Config Qdrant 索引配置，支持 VectorDim、Distance、BatchSize 等。
type Config struct {
	Client     *qdrantclient.Client // Required: Qdrant client
	Collection string               // Required: Collection name
	VectorDim  int                  // Required: Vector dimension
	Distance   qdrantclient.Distance
	BatchSize  int
	Embedding  embedding.Embedder // Required: Embedding component
	IsAsync    bool               // 是否异步模式（包含 QA 向量）
}

// Indexer Qdrant 索引实现，内部使用 StoreWithNamedVectors 支持 content_vector / qa_content_vector。
type Indexer struct {
	config       *Config
	einoIndexer  indexer.Indexer
	asyncIndexer indexer.Indexer
}

// NewIndexer 创建 Qdrant 索引器。eino-ext 不支持命名向量，故 Store 实际委托 StoreWithNamedVectors。
func NewIndexer(ctx context.Context, config *Config) (indexer.Indexer, error) {
	if config.Client == nil {
		return nil, fmt.Errorf("qdrant client is required")
	}
	if config.Collection == "" {
		return nil, fmt.Errorf("collection name is required")
	}
	if config.Embedding == nil {
		return nil, fmt.Errorf("embedding component is required")
	}
	if config.BatchSize == 0 {
		config.BatchSize = 10
	}
	if config.Distance == 0 {
		config.Distance = qdrantclient.Distance_Cosine
	}

	einoConfig := &einoqdrant.Config{
		Client:     config.Client,
		Collection: config.Collection,
		VectorDim:  config.VectorDim,
		Distance:   config.Distance,
		Embedding:  config.Embedding,
		BatchSize:  config.BatchSize,
	}

	einoIndexer, err := einoqdrant.NewIndexer(ctx, einoConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create eino indexer: %w", err)
	}

	idx := &Indexer{
		config:      config,
		einoIndexer: einoIndexer,
	}

	return idx, nil
}

// Store 实现 Indexer 接口，委托 StoreWithNamedVectors 以支持命名向量（content_vector 等）。
func (idx *Indexer) Store(ctx context.Context, docs []*schema.Document, opts ...indexer.Option) ([]string, error) {
	return idx.StoreWithNamedVectors(ctx, docs, opts...)
}

// GetType 返回索引器类型标识，用于日志与调试。
func (idx *Indexer) GetType() string {
	return "qdrant_indexer"
}
