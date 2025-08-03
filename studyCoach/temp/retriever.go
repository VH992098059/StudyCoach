package temp

import (
	"context"

	"github.com/cloudwego/eino-ext/components/retriever/es8"
	"github.com/cloudwego/eino/components/retriever"
)

// newRetriever component initialization function of node 'StudyRetriever' in graph 'studyCoachFor'
func newRetriever(ctx context.Context) (rtr retriever.Retriever, err error) {
	// TODO Modify component configuration here.
	config := &es8.RetrieverConfig{}
	embeddingIns11, err := newEmbedding1(ctx)
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
