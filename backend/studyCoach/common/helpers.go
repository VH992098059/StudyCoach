package common

import (
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/schema"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/create"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/exists"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/refresh"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types/enums/densevectorsimilarity"
	"github.com/qdrant/go-client/qdrant"
)

// RefreshIndex 强制刷新 ES 索引，使刚写入的文档立即可被搜索。仅 ES 有效。
func (c *Config) RefreshIndex(ctx context.Context) error {
	if !c.UseES() || c.Client == nil {
		return nil
	}
	_, err := refresh.NewRefreshFunc(c.Client)().Index(c.IndexName).Do(ctx)
	return err
}

// IndexExists 检查索引/集合是否存在（支持 ES、Qdrant、Milvus）。
func (c *Config) IndexExists(ctx context.Context) (bool, error) {
	if c.UseES() {
		return exists.NewExistsFunc(c.Client)(c.IndexName).Do(ctx)
	}
	if c.UseQdrant() {
		return c.QdrantClient.CollectionExists(ctx, c.IndexName)
	}
	if c.UseMilvus() {
		return c.milvusCollectionExists(ctx)
	}
	return false, fmt.Errorf("no valid client configuration")
}

// CreateIndex 创建索引/集合（Milvus 由首次写入自动创建）。
func (c *Config) CreateIndex(ctx context.Context) error {
	if c.UseES() {
		// ES
		_, err := create.NewCreateFunc(c.Client)(c.IndexName).Request(&create.Request{
			Mappings: &types.TypeMapping{
				Properties: map[string]types.Property{
					FieldContent:  types.NewTextProperty(),
					FieldExtra:    types.NewTextProperty(),
					KnowledgeName: types.NewKeywordProperty(),
					FieldContentVector: &types.DenseVectorProperty{
						Dims:       TypeOf(1024),
						Index:      TypeOf(true),
						Similarity: TypeOf(densevectorsimilarity.Cosine),
					},
					FieldQAContentVector: &types.DenseVectorProperty{
						Dims:       TypeOf(1024),
						Index:      TypeOf(true),
						Similarity: TypeOf(densevectorsimilarity.Cosine),
					},
				},
			},
		}).Do(ctx)
		return err
	}
	if c.UseQdrant() {
		// Qdrant - 创建集合，支持命名向量
		vectorsMap := map[string]*qdrant.VectorParams{
			FieldContentVector: {
				Size:     1024,
				Distance: qdrant.Distance_Cosine,
			},
			FieldQAContentVector: {
				Size:     1024,
				Distance: qdrant.Distance_Cosine,
			},
		}
		err := c.QdrantClient.CreateCollection(ctx, &qdrant.CreateCollection{
			CollectionName: c.IndexName,
			VectorsConfig:  qdrant.NewVectorsConfigMap(vectorsMap),
		})
		if err != nil {
			return fmt.Errorf("failed to create collection: %w", err)
		}

		// 创建 payload 索引以支持过滤
		_, err = c.QdrantClient.CreateFieldIndex(ctx, &qdrant.CreateFieldIndexCollection{
			CollectionName: c.IndexName,
			FieldName:      KnowledgeName,
			FieldType:      qdrant.FieldType_FieldTypeKeyword.Enum(),
		})
		if err != nil {
			return fmt.Errorf("failed to create field index: %w", err)
		}

		return nil
	}
	if c.UseMilvus() {
		// Milvus 由 indexer 首次 Store 时自动创建 collection，此处无需操作
		return nil
	}
	return fmt.Errorf("no valid client configuration")
}

// DeleteDocument 按文档 ID 删除单条文档（Milvus 待实现）。
func (c *Config) DeleteDocument(ctx context.Context, documentID string) error {
	if c.UseES() {
		// ES
		res, err := c.Client.Delete(c.IndexName, documentID)
		if err != nil {
			return fmt.Errorf("delete document failed: %w", err)
		}
		defer res.Body.Close()

		if res.IsError() {
			return fmt.Errorf("delete document failed: %s", res.String())
		}
		return nil
	}
	if c.UseQdrant() {
		_, err := c.QdrantClient.Delete(ctx, &qdrant.DeletePoints{
			CollectionName: c.IndexName,
			Points: &qdrant.PointsSelector{
				PointsSelectorOneOf: &qdrant.PointsSelector_Points{
					Points: &qdrant.PointsIdsList{
						Ids: []*qdrant.PointId{
							{PointIdOptions: &qdrant.PointId_Uuid{Uuid: documentID}},
						},
					},
				},
			},
		})
		if err != nil {
			return fmt.Errorf("failed to delete document: %w", err)
		}
		return nil
	}
	if c.UseMilvus() {
		return fmt.Errorf("DeleteDocument for Milvus not implemented yet")
	}
	return fmt.Errorf("no valid client configuration")
}

// GetKnowledgeBaseList 获取所有知识库名称列表（ES 未实现；Qdrant 支持）。
func (c *Config) GetKnowledgeBaseList(ctx context.Context) ([]string, error) {
	if c.UseES() {
		// ES - 可通过 terms 聚合 _knowledge_name 实现，待补充
		return nil, fmt.Errorf("ES GetKnowledgeBaseList not implemented yet")
	}
	if c.UseQdrant() {
		// Qdrant - 滚动查询并去重
		knowledgeMap := make(map[string]bool)

		offset := (*qdrant.PointId)(nil)
		limit := uint32(100)

		for {
			scrollResp, err := c.QdrantClient.Scroll(ctx, &qdrant.ScrollPoints{
				CollectionName: c.IndexName,
				Limit:          &limit,
				Offset:         offset,
				WithPayload:    &qdrant.WithPayloadSelector{SelectorOptions: &qdrant.WithPayloadSelector_Enable{Enable: true}},
			})
			if err != nil {
				return nil, fmt.Errorf("failed to scroll points: %w", err)
			}

			if len(scrollResp) == 0 {
				break
			}

			for _, point := range scrollResp {
				if payload := point.GetPayload(); payload != nil {
					if knowledgeName, ok := payload[KnowledgeName]; ok {
						if name, ok := knowledgeName.GetKind().(*qdrant.Value_StringValue); ok {
							knowledgeMap[name.StringValue] = true
						}
					}
				}
			}

			if len(scrollResp) < int(limit) {
				break
			}
			offset = scrollResp[len(scrollResp)-1].Id
		}

		var list []string
		for name := range knowledgeMap {
			list = append(list, name)
		}

		return list, nil
	}
	if c.UseMilvus() {
		return nil, fmt.Errorf("GetKnowledgeBaseList for Milvus not implemented yet")
	}
	return nil, fmt.Errorf("no valid client configuration")
}

// SearchDocumentsByIDs 按知识库名称和 ID 列表精确拉取文档（用于异步索引回查）。
func (c *Config) SearchDocumentsByIDs(ctx context.Context, knowledgeName string, docIDs []string, size int) ([]*schema.Document, error) {
	if c.UseES() {
		// ES
		esQuery := &types.Query{
			Bool: &types.BoolQuery{
				Must: []types.Query{
					{Match: map[string]types.MatchQuery{KnowledgeName: {Query: knowledgeName}}},
					{Terms: &types.TermsQuery{TermsQuery: map[string]types.TermsQueryField{"_id": docIDs}}},
				},
			},
		}

		sreq := search.NewRequest()
		sreq.Query = esQuery
		sreq.Size = TypeOf(size)

		searchResp, err := search.NewSearchFunc(c.Client)().
			Index(c.IndexName).
			Request(sreq).
			Do(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to search: %w", err)
		}

		var docs []*schema.Document
		for _, hit := range searchResp.Hits.Hits {
			doc, err := esHitToDocument(ctx, hit)
			if err != nil {
				continue
			}
			docs = append(docs, doc)
		}

		return docs, nil
	}
	if c.UseQdrant() {
		ids := make([]*qdrant.PointId, len(docIDs))
		for i, id := range docIDs {
			ids[i] = &qdrant.PointId{PointIdOptions: &qdrant.PointId_Uuid{Uuid: id}}
		}

		filter := &qdrant.Filter{
			Must: []*qdrant.Condition{
				{
					ConditionOneOf: &qdrant.Condition_Field{
						Field: &qdrant.FieldCondition{
							Key: KnowledgeName,
							Match: &qdrant.Match{
								MatchValue: &qdrant.Match_Keyword{
									Keyword: knowledgeName,
								},
							},
						},
					},
				},
				{
					ConditionOneOf: &qdrant.Condition_HasId{
						HasId: &qdrant.HasIdCondition{
							HasId: ids,
						},
					},
				},
			},
		}

		limit := uint32(size)
		scrollResp, err := c.QdrantClient.Scroll(ctx, &qdrant.ScrollPoints{
			CollectionName: c.IndexName,
			Filter:         filter,
			Limit:          &limit,
			WithPayload:    &qdrant.WithPayloadSelector{SelectorOptions: &qdrant.WithPayloadSelector_Enable{Enable: true}},
			WithVectors:    &qdrant.WithVectorsSelector{SelectorOptions: &qdrant.WithVectorsSelector_Enable{Enable: true}},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to scroll: %w", err)
		}

		var docs []*schema.Document
		for _, point := range scrollResp {
			doc, err := qdrantPointToDocument(ctx, point)
			if err != nil {
				continue
			}
			docs = append(docs, doc)
		}

		return docs, nil
	}
	if c.UseMilvus() {
		return c.searchDocumentsByIDsMilvus(ctx, knowledgeName, docIDs, size)
	}
	return nil, fmt.Errorf("no valid client configuration")
}

// DeleteDocumentsByCronID 按 cron_id 删除该定时任务产生的所有文档。
// 仅 ES 已实现；Qdrant、Milvus 待实现。
func (c *Config) DeleteDocumentsByCronID(ctx context.Context, cronID string) error {
	if c.UseES() {
		return DeleteDocumentsByCronID(ctx, c.Client, cronID)
	}
	if c.UseQdrant() || c.UseMilvus() {
		// TODO: 实现 Qdrant/Milvus 的按 cron_id 删除
		return nil
	}
	return fmt.Errorf("no valid client configuration")
}

// esHitToDocument 将 Elasticsearch 的 Hit 转换为 schema.Document。
// 解析 _source 中的 content、content_vector、ext、_knowledge_name 等字段。
func esHitToDocument(ctx context.Context, hit types.Hit) (*schema.Document, error) {
	doc := &schema.Document{
		ID:       *hit.Id_,
		MetaData: map[string]any{},
	}

	var src map[string]any
	if err := sonic.Unmarshal(hit.Source_, &src); err != nil {
		return nil, err
	}

	for field, val := range src {
		switch field {
		case FieldContent:
			doc.Content = val.(string)
		case FieldContentVector:
			var v []float64
			for _, item := range val.([]interface{}) {
				v = append(v, item.(float64))
			}
			doc.WithDenseVector(v)
		case FieldQAContentVector, FieldQAContent:
			// 这两个字段都不返回
		case FieldExtra:
			if val == nil {
				continue
			}
			doc.MetaData[FieldExtra] = val.(string)
		case KnowledgeName:
			doc.MetaData[KnowledgeName] = val.(string)
		case FieldCronID:
			// cron_id 可能为 nil（手动索引时未设置），检索时忽略即可
			continue
		default:
			// 忽略未知字段，避免因索引 schema 扩展导致检索失败
			continue
		}
	}

	if hit.Score_ != nil {
		doc.WithScore(float64(*hit.Score_))
	}

	return doc, nil
}

// qdrantPointToDocument 将 Qdrant 的 RetrievedPoint 转换为 schema.Document。
// 用于 SearchDocumentsByIDs 的 Scroll 结果，解析 payload 与 vectors。
func qdrantPointToDocument(_ context.Context, point *qdrant.RetrievedPoint) (*schema.Document, error) {
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
		if content, ok := payload[FieldContent]; ok {
			if val, ok := content.GetKind().(*qdrant.Value_StringValue); ok {
				doc.Content = val.StringValue
			}
		}

		// 提取 extra
		if extra, ok := payload[FieldExtra]; ok {
			if val, ok := extra.GetKind().(*qdrant.Value_StringValue); ok {
				doc.MetaData[FieldExtra] = val.StringValue
			}
		}

		// 提取 knowledge_name
		if knowledgeName, ok := payload[KnowledgeName]; ok {
			if val, ok := knowledgeName.GetKind().(*qdrant.Value_StringValue); ok {
				doc.MetaData[KnowledgeName] = val.StringValue
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

	return doc, nil
}
