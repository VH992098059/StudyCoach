package retriever

import (
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/gogf/gf/v2/frame/g"

	milvus2 "github.com/cloudwego/eino-ext/components/retriever/milvus2"
	milvus2search "github.com/cloudwego/eino-ext/components/retriever/milvus2/search_mode"
	"github.com/milvus-io/milvus/client/v2/milvusclient"
)

// MilvusRetrieverConfig Milvus 检索配置
type MilvusRetrieverConfig struct {
	Client       *milvusclient.Client
	ClientConfig *milvusclient.ClientConfig
	Collection   string
	VectorField  string
	TopK         int
	Embedding    embedding.Embedder
}

// NewMilvusRetriever 创建 Milvus 检索器，使用 eino-ext milvus2 组件。
func NewMilvusRetriever(ctx context.Context, config *MilvusRetrieverConfig) (retriever.Retriever, error) {
	if config.Embedding == nil {
		return nil, fmt.Errorf("embedding is required")
	}
	if config.Collection == "" {
		return nil, fmt.Errorf("collection name is required")
	}
	if config.VectorField == "" {
		config.VectorField = common.FieldContentVector
	}
	if config.TopK <= 0 {
		config.TopK = 10
	}

	cfg := &milvus2.RetrieverConfig{
		Collection:  config.Collection,
		TopK:        config.TopK,
		VectorField: config.VectorField,
		SearchMode:  milvus2search.NewApproximate(milvus2.COSINE),
		Embedding:   config.Embedding,
	}
	if config.Client != nil {
		cfg.Client = config.Client
	} else if config.ClientConfig != nil {
		cfg.ClientConfig = config.ClientConfig
	} else {
		return nil, fmt.Errorf("milvus Client or ClientConfig is required")
	}

	rtr, err := milvus2.NewRetriever(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create milvus retriever: %w", err)
	}
	g.Log().Infof(ctx, "MilvusRetriever created, collection=%s, vectorField=%s", config.Collection, config.VectorField)
	return rtr, nil
}
