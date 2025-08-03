package eino

import (
	"context"
	"github.com/cloudwego/eino-ext/components/indexer/es8"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	configTool "studyCoach/studyCoach/configTool"
)

// newIndexer component initialization function of node 'Indexer1' in graph 'studyCoachFor'
func newIndexer(ctx context.Context, conf *configTool.Config) (idr indexer.Indexer, err error) {
	// TODO Modify component configuration here.
	config := &es8.IndexerConfig{
		Client:    conf.Client,
		Index:     conf.IndexName,
		BatchSize: 10,
		DocumentToFields: func(ctx context.Context, doc *schema.Document) (field2Value map[string]es8.FieldValue, err error) {
			return
		},
	}
	embeddingIns11, err := newEmbedding(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.Embedding = embeddingIns11
	idr, err = es8.NewIndexer(ctx, config)
	if err != nil {
		return nil, err
	}
	return idr, nil
}
