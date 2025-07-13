package eino

import (
	"context"
	"fmt"
	"github.com/cloudwego/eino/components/retriever/elasticsearch"
	"github.com/cloudwego/eino/schema"
	"studyCoach/studyCoach/common"
	"studyCoach/studyCoach/configTool"
)

func newRetriever(ctx context.Context, conf *configTool.Config) (r schema.Retriever, err error) {
	embedding, err := newEmbedding1(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create embedding: %w", err)
	}

	r, err = elasticsearch.NewRetriever(ctx,
		elasticsearch.WithClient(conf.EsClient),
		elasticsearch.WithIndexName(conf.IndexName),
		elasticsearch.WithTopK(5),
		elasticsearch.WithSearchMode(elasticsearch.CosineMode),
		elasticsearch.WithEmbedder(embedding),
		elasticsearch.WithParseFunc(func(hit map[string]any) (*schema.Document, error) {
			source, ok := hit["_source"].(map[string]any)
			if !ok {
				return nil, fmt.Errorf("invalid source format")
			}

			content, ok := source[common.ContentField].(string)
			if !ok {
				return nil, fmt.Errorf("content field not found or not a string")
			}

			location, _ := source[common.LocationField].(string)
			knowledgeName, _ := source[common.KnowledgeNameField].(string)

			doc := &schema.Document{
				Content: content,
				Metadata: map[string]any{
					"location":       location,
					"knowledge_name": knowledgeName,
				},
			}

			return doc, nil
		}),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create retriever: %w", err)
	}

	return r, nil
}
