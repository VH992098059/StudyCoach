package qdrant

import (
	"backend/studyCoach/aiModel/indexer/docmeta"
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/google/uuid"
	qdrantclient "github.com/qdrant/go-client/qdrant"
)

// StoreWithNamedVectors 使用命名向量将文档写入 Qdrant。
// 支持 content_vector（qa_content_vector 由异步任务补充），payload 含 content、_knowledge_name、ext。
// 知识库名称从 context 的 common.KnowledgeName 获取。
func (idx *Indexer) StoreWithNamedVectors(ctx context.Context, docs []*schema.Document, opts ...indexer.Option) ([]string, error) {
	if len(docs) == 0 {
		return nil, nil
	}

	var knowledgeName string
	if value, ok := ctx.Value(common.KnowledgeName).(string); ok {
		knowledgeName = value
	} else {
		return nil, fmt.Errorf("必须提供知识库名称")
	}

	g.Log().Infof(ctx, "QdrantIndexer.StoreWithNamedVectors: storing %d documents to collection %s, knowledge_name=%s", len(docs), idx.config.Collection, knowledgeName)

	points := make([]*qdrantclient.PointStruct, 0, len(docs))
	ids := make([]string, 0, len(docs))

	for _, doc := range docs {
		if len(doc.ID) == 0 {
			doc.ID = uuid.New().String()
		}
		ids = append(ids, doc.ID)

		embeddings, err := idx.config.Embedding.EmbedStrings(ctx, []string{doc.Content})
		if err != nil {
			g.Log().Errorf(ctx, "Failed to embed document %s: %v", doc.ID, err)
			return nil, fmt.Errorf("failed to embed document: %w", err)
		}
		if len(embeddings) == 0 {
			return nil, fmt.Errorf("embedding returned empty result")
		}

		vec32 := make([]float32, len(embeddings[0]))
		for i, v := range embeddings[0] {
			vec32[i] = float32(v)
		}

		payload := make(map[string]*qdrantclient.Value)
		payload[common.FieldContent] = &qdrantclient.Value{
			Kind: &qdrantclient.Value_StringValue{StringValue: doc.Content},
		}
		payload[common.KnowledgeName] = &qdrantclient.Value{
			Kind: &qdrantclient.Value_StringValue{StringValue: knowledgeName},
		}

		if doc.MetaData != nil {
			extData := docmeta.GetExtData(doc)
			if len(extData) > 0 {
				marshal, _ := sonic.Marshal(extData)
				payload[common.FieldExtra] = &qdrantclient.Value{
					Kind: &qdrantclient.Value_StringValue{StringValue: string(marshal)},
				}
			}
		}

		vectors := &qdrantclient.Vectors{
			VectorsOptions: &qdrantclient.Vectors_Vectors{
				Vectors: &qdrantclient.NamedVectors{
					Vectors: map[string]*qdrantclient.Vector{
						common.FieldContentVector: {
							Data: vec32,
						},
					},
				},
			},
		}

		point := &qdrantclient.PointStruct{
			Id: &qdrantclient.PointId{
				PointIdOptions: &qdrantclient.PointId_Uuid{Uuid: doc.ID},
			},
			Vectors: vectors,
			Payload: payload,
		}

		points = append(points, point)
	}

	_, err := idx.config.Client.Upsert(ctx, &qdrantclient.UpsertPoints{
		CollectionName: idx.config.Collection,
		Points:         points,
	})
	if err != nil {
		g.Log().Errorf(ctx, "QdrantIndexer.StoreWithNamedVectors failed: %v", err)
		return nil, fmt.Errorf("failed to upsert points: %w", err)
	}

	g.Log().Infof(ctx, "QdrantIndexer.StoreWithNamedVectors success: stored %d documents, IDs: %v", len(ids), ids)

	return ids, nil
}
