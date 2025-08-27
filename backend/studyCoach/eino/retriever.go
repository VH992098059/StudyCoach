package eino

import (
	"backend/studyCoach/common"
	"backend/studyCoach/configTool"
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino-ext/components/retriever/es8"
	"github.com/cloudwego/eino-ext/components/retriever/es8/search_mode"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/schema"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
)

// newRetriever component initialization function of node 'Retriever2' in graph 'studyCoachFor'
func newRetriever(ctx context.Context, conf *configTool.Config) (rtr retriever.Retriever, err error) {
	vectorField := common.FieldContentVector
	if value, ok := ctx.Value(common.RetrieverFieldKey).(string); ok {
		vectorField = value
	}
	retrieverConfig := &es8.RetrieverConfig{
		Client: conf.Client,
		Index:  conf.IndexName,
		SearchMode: search_mode.SearchModeDenseVectorSimilarity(
			search_mode.DenseVectorSimilarityTypeCosineSimilarity,
			vectorField,
		),
		ResultParser: EsHit2Document,
	}
	embeddingIns11, err := newEmbedding1(ctx, conf)
	if err != nil {
		return nil, err
	}
	retrieverConfig.Embedding = embeddingIns11
	rtr, err = es8.NewRetriever(ctx, retrieverConfig)
	if err != nil {
		return nil, err
	}
	return rtr, nil
}
func EsHit2Document(ctx context.Context, hit types.Hit) (doc *schema.Document, err error) {
	doc = &schema.Document{
		ID:       *hit.Id_,
		MetaData: map[string]any{},
	}

	var src map[string]any
	if err = sonic.Unmarshal(hit.Source_, &src); err != nil {
		return nil, err
	}

	for field, val := range src {
		switch field {
		case common.FieldContent:
			doc.Content = val.(string)
		case common.FieldContentVector:
			var v []float64
			for _, item := range val.([]interface{}) {
				v = append(v, item.(float64))
			}
			doc.WithDenseVector(v)
		case common.FieldQAContentVector, common.FieldQAContent:
			// 这两个字段都不返回

		case common.FieldExtra:
			if val == nil {
				continue
			}
			doc.MetaData[common.FieldExtra] = val.(string)
		case common.KnowledgeName:
			doc.MetaData[common.KnowledgeName] = val.(string)
		default:
			return nil, fmt.Errorf("unexpected field=%s, val=%v", field, val)
		}
	}

	if hit.Score_ != nil {
		doc.WithScore(float64(*hit.Score_))
	}

	return doc, nil
}
