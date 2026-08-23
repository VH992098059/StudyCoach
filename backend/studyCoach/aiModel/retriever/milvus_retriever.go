package retriever

import (
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/schema"
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
		Collection:   config.Collection,
		TopK:         config.TopK,
		VectorField:  config.VectorField,
		OutputFields: []string{"id", "content", "metadata"}, // 只取必要字段，避免拉回整条向量
		SearchMode:   milvus2search.NewApproximate(milvus2.COSINE),
		Embedding:    config.Embedding,
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
	return &milvusRetrieverWrapper{inner: rtr}, nil
}

// milvusRetrieverWrapper 包装 Milvus 检索器，添加知识库状态过滤
type milvusRetrieverWrapper struct {
	inner retriever.Retriever
}

func (w *milvusRetrieverWrapper) Retrieve(ctx context.Context, query string, opts ...retriever.Option) ([]*schema.Document, error) {
	docs, err := w.inner.Retrieve(ctx, query, opts...)
	if err != nil {
		return nil, err
	}

	// 获取启用的知识库 ID
	enabledKBIds, err := getEnabledKBIds(ctx)
	if err != nil || len(enabledKBIds) == 0 {
		return docs, nil
	}

	// 过滤结果
	kbIdMap := make(map[string]bool)
	for _, id := range enabledKBIds {
		kbIdMap[id] = true
	}

	filtered := make([]*schema.Document, 0, len(docs))
	for _, doc := range docs {
		if kbPassesEnabledFilter(doc.MetaData, kbIdMap) {
			filtered = append(filtered, doc)
		}
	}
	return filtered, nil
}

// kbPassesEnabledFilter 判断文档是否通过「已启用知识库」过滤：
//   - 无 knowledge_base_id（旧文档）→ 保留（向后兼容，与 ES 路径一致）
//   - 有 knowledge_base_id 且命中启用列表 → 保留
//   - 有 knowledge_base_id 但未启用 → 过滤
//
// knowledge_base_id 现为知识库 UUID（string）。
func kbPassesEnabledFilter(meta map[string]any, enabled map[string]bool) bool {
	raw, exists := meta[common.KnowledgeBaseId]
	if !exists {
		return true
	}
	id, ok := raw.(string)
	if !ok {
		return true // 类型异常，保守保留，避免误删
	}
	return enabled[id]
}
