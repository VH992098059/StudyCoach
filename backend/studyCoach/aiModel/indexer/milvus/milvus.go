// Package milvus 提供基于 Milvus 的向量索引实现。
package milvus

import (
	"backend/studyCoach/aiModel/indexer/docmeta"
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/google/uuid"

	milvus2 "github.com/cloudwego/eino-ext/components/indexer/milvus2"
	"github.com/milvus-io/milvus/client/v2/milvusclient"
)

// Config Milvus 索引配置
type Config struct {
	Client       *milvusclient.Client
	ClientConfig *milvusclient.ClientConfig
	Collection   string
	VectorDim    int
	Embedding    embedding.Embedder
	BatchSize    int
}

// NewIndexer 创建 Milvus 索引器，使用 eino-ext milvus2 组件。
func NewIndexer(ctx context.Context, config *Config) (indexer.Indexer, error) {
	if config.Embedding == nil {
		return nil, fmt.Errorf("embedding is required")
	}
	if config.Collection == "" {
		return nil, fmt.Errorf("collection name is required")
	}
	if config.VectorDim <= 0 {
		config.VectorDim = 1024
	}
	if config.BatchSize <= 0 {
		config.BatchSize = 10
	}

	idxConfig := &milvus2.IndexerConfig{
		Collection: config.Collection,
		Vector: &milvus2.VectorConfig{
			Dimension:    int64(config.VectorDim),
			MetricType:   milvus2.COSINE,
			VectorField:  common.FieldContentVector,
			IndexBuilder: milvus2.NewHNSWIndexBuilder().WithM(16).WithEfConstruction(200),
		},
		Embedding: config.Embedding,
	}
	if config.Client != nil {
		idxConfig.Client = config.Client
	} else if config.ClientConfig != nil {
		idxConfig.ClientConfig = config.ClientConfig
	} else {
		return nil, fmt.Errorf("milvus Client or ClientConfig is required")
	}

	inner, err := milvus2.NewIndexer(ctx, idxConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create milvus indexer: %w", err)
	}
	return &indexerWrapper{inner: inner}, nil
}

// indexerWrapper 包装 eino-ext Milvus indexer，在 Store 时注入 knowledge_name
type indexerWrapper struct {
	inner indexer.Indexer
}

func (w *indexerWrapper) Store(ctx context.Context, docs []*schema.Document, opts ...indexer.Option) ([]string, error) {
	knowledgeName, _ := ctx.Value(common.KnowledgeName).(string)
	if knowledgeName == "" {
		return nil, fmt.Errorf("必须提供知识库名称")
	}
	g.Log().Infof(ctx, "MilvusIndexer.Store: storing %d documents, knowledge_name=%s", len(docs), knowledgeName)

	for _, doc := range docs {
		if len(doc.ID) == 0 {
			doc.ID = uuid.New().String()
		}
		if doc.MetaData == nil {
			doc.MetaData = make(map[string]any)
		}
		doc.MetaData[common.KnowledgeName] = knowledgeName
		if ext := docmeta.GetExtData(doc); len(ext) > 0 {
			marshal, _ := sonic.Marshal(ext)
			doc.MetaData[common.FieldExtra] = string(marshal)
		}
	}
	return w.inner.Store(ctx, docs, opts...)
}

func (w *indexerWrapper) GetType() string {
	return "milvus_indexer"
}
