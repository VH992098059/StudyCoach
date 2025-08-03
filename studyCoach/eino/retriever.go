package eino

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/cloudwego/eino-ext/components/retriever/es8/search_mode"
	"github.com/cloudwego/eino/schema"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"studyCoach/studyCoach/common"
	"studyCoach/studyCoach/configTool"

	"github.com/cloudwego/eino-ext/components/retriever/es8"
	"github.com/cloudwego/eino/components/retriever"
)

// newRetriever component initialization function of node 'Retriever2' in graph 'studyCoachFor'
func newRetriever(ctx context.Context, conf *configTool.Config) (rtr retriever.Retriever, err error) {
	// TODO Modify component configuration here.
	config := &es8.RetrieverConfig{
		Client: conf.Client,
		Index:  conf.IndexName,
		TopK:   5,
		SearchMode: search_mode.SearchModeDenseVectorSimilarity(
			search_mode.DenseVectorSimilarityTypeCosineSimilarity,
			common.FieldContentVector,
		),
		ResultParser: func(ctx context.Context, hit types.Hit) (doc *schema.Document, err error) {
			doc = &schema.Document{
				ID:       *hit.Id_,
				Content:  "",
				MetaData: map[string]any{},
			}

			var src map[string]any
			if err = json.Unmarshal(hit.Source_, &src); err != nil {
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

				case common.FieldExtra:
					if val == nil {
						continue
					}
					doc.MetaData[common.DocExtra] = val.(string)
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
		},
	}
	embeddingIns11, err := newEmbedding1(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.Embedding = embeddingIns11
	rtr, err = es8.NewRetriever(ctx, config)
	if err != nil {
		return nil, err
	}
	return rtr, nil
}
