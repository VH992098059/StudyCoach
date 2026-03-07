// Package retriever 提供向量检索实现，支持 ES8 与 Qdrant，为 Milvus 等扩展预留接口形态。
package retriever

import (
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/schema"
	"github.com/qdrant/go-client/qdrant"
)

// QdrantRetrieverConfig Qdrant 检索配置，支持命名向量与过滤条件。
type QdrantRetrieverConfig struct {
	Client         *qdrant.Client     // Required: Qdrant client
	Collection     string             // Required: Collection name
	Embedding      embedding.Embedder // Required: Query embedding component
	VectorField    string             // Optional: Vector field name (for named vectors)
	ScoreThreshold *float64           // Optional: Score threshold
	TopK           int                // Optional: Number of results (default: 10)
}

// QdrantRetriever Qdrant 检索实现，支持 content_vector / qa_content_vector 命名向量及 payload 过滤。
type QdrantRetriever struct {
	config *QdrantRetrieverConfig
}

// NewQdrantRetriever 创建 Qdrant 检索器，支持 VectorField 指定命名向量（如 content_vector / qa_content_vector）。
func NewQdrantRetriever(ctx context.Context, config *QdrantRetrieverConfig) (retriever.Retriever, error) {
	if config.Client == nil {
		return nil, fmt.Errorf("qdrant client is required")
	}
	if config.Collection == "" {
		return nil, fmt.Errorf("collection name is required")
	}
	if config.Embedding == nil {
		return nil, fmt.Errorf("embedding component is required")
	}
	if config.TopK == 0 {
		config.TopK = 10
	}

	return &QdrantRetriever{
		config: config,
	}, nil
}

// Retrieve 执行向量检索：先 Embedding 查询文本，再调用 Qdrant QueryPoints，支持 TopK、ScoreThreshold、Filter。
func (r *QdrantRetriever) Retrieve(ctx context.Context, query string, opts ...retriever.Option) ([]*schema.Document, error) {
	// 解析选项
	options := &retriever.Options{}
	retriever.GetCommonOptions(options, opts...)

	// 获取查询向量
	embedResp, err := r.config.Embedding.EmbedStrings(ctx, []string{query})
	if err != nil {
		return nil, fmt.Errorf("failed to embed query: %w", err)
	}

	if len(embedResp) == 0 || len(embedResp[0]) == 0 {
		return nil, fmt.Errorf("empty embedding result")
	}

	queryVector := embedResp[0]

	// 转换为 float32
	queryVec32 := make([]float32, len(queryVector))
	for i, v := range queryVector {
		queryVec32[i] = float32(v)
	}

	// 构建 Qdrant 查询
	topK := uint64(r.config.TopK)
	if options.TopK != nil && *options.TopK > 0 {
		topK = uint64(*options.TopK)
	}

	// 构建查询请求
	queryReq := &qdrant.QueryPoints{
		CollectionName: r.config.Collection,
		Query: &qdrant.Query{
			Variant: &qdrant.Query_Nearest{
				Nearest: &qdrant.VectorInput{
					Variant: &qdrant.VectorInput_Dense{
						Dense: &qdrant.DenseVector{
							Data: queryVec32,
						},
					},
				},
			},
		},
		Limit:       &topK,
		WithPayload: &qdrant.WithPayloadSelector{SelectorOptions: &qdrant.WithPayloadSelector_Enable{Enable: true}},
		WithVectors: &qdrant.WithVectorsSelector{SelectorOptions: &qdrant.WithVectorsSelector_Enable{Enable: true}},
	}

	// 如果指定了向量字段（命名向量），使用 Using 参数
	if r.config.VectorField != "" {
		queryReq.Using = &r.config.VectorField
	}

	// 如果设置了分数阈值
	if r.config.ScoreThreshold != nil {
		scoreThreshold := float32(*r.config.ScoreThreshold)
		queryReq.ScoreThreshold = &scoreThreshold
	}

	// 从 options 中提取过滤条件（通过 DSLInfo 传递）
	if options.DSLInfo != nil {
		if filter, ok := options.DSLInfo["filter"].(*qdrant.Filter); ok {
			queryReq.Filter = filter
		}
	}

	// 执行搜索
	searchResp, err := r.config.Client.Query(ctx, queryReq)
	if err != nil {
		return nil, fmt.Errorf("failed to query: %w", err)
	}

	// 转换结果
	var docs []*schema.Document
	for _, point := range searchResp {
		doc, err := r.qdrantPointToDocument(ctx, point)
		if err != nil {
			continue
		}
		docs = append(docs, doc)
	}

	return docs, nil
}

// qdrantPointToDocument 将 Qdrant ScoredPoint 转为 schema.Document，解析 payload（content、ext、_knowledge_name）与 score。
func (r *QdrantRetriever) qdrantPointToDocument(_ context.Context, point *qdrant.ScoredPoint) (*schema.Document, error) {
	var docID string
	switch id := point.Id.GetPointIdOptions().(type) {
	case *qdrant.PointId_Uuid:
		docID = id.Uuid
	case *qdrant.PointId_Num:
		docID = fmt.Sprintf("%d", id.Num)
	default:
		return nil, fmt.Errorf("unsupported point id type")
	}

	doc := &schema.Document{
		ID:       docID,
		MetaData: map[string]any{},
	}

	payload := point.GetPayload()
	if payload != nil {
		// 提取 content
		if content, ok := payload[common.FieldContent]; ok {
			if val, ok := content.GetKind().(*qdrant.Value_StringValue); ok {
				doc.Content = val.StringValue
			}
		}

		// 提取 metadata (extra)
		if extra, ok := payload[common.FieldExtra]; ok {
			if val, ok := extra.GetKind().(*qdrant.Value_StringValue); ok {
				var metadata map[string]any
				if err := sonic.Unmarshal([]byte(val.StringValue), &metadata); err == nil {
					for k, v := range metadata {
						doc.MetaData[k] = v
					}
				}
			}
		}

		// 提取 knowledge_name
		if knowledgeName, ok := payload[common.KnowledgeName]; ok {
			if val, ok := knowledgeName.GetKind().(*qdrant.Value_StringValue); ok {
				doc.MetaData[common.KnowledgeName] = val.StringValue
			}
		}
	}

	// 提取向量
	if vectors := point.GetVectors(); vectors != nil {
		switch v := vectors.GetVectorsOptions().(type) {
		case *qdrant.VectorsOutput_Vector:
			// 转换 float32 到 float64
			data := v.Vector.GetData()
			vec64 := make([]float64, len(data))
			for i, val := range data {
				vec64[i] = float64(val)
			}
			doc.WithDenseVector(vec64)
		}
	}

	// 提取分数
	doc.WithScore(float64(point.Score))

	return doc, nil
}

// GetType 返回检索器类型标识，用于日志与调试。
func (r *QdrantRetriever) GetType() string {
	return "qdrant_retriever"
}
