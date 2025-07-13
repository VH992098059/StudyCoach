package eino

import (
	"context"
	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/schema"
	"github.com/cloudwego/score"
)

type DocumentTransformerImpl struct {
	config *DocumentTransformerConfig
}

type DocumentTransformerConfig struct {
}

// newDocumentTransformer component initialization function of node 'CustomDocumentTransformer9' in graph 'studyCoachFor'
func newDocumentTransformer(ctx context.Context) (tfr document.Transformer, err error) {
	// TODO Modify component configuration here.
	config := &DocumentTransformerConfig{}
	tfr = &DocumentTransformerImpl{config: config}
	return tfr, nil
}

func (impl *DocumentTransformerImpl) Transform(ctx context.Context, src []*schema.Document, opts ...document.TransformerOption) ([]*schema.Document, error) {
	panic("implement me")
}

// newDocumentTransformer1 component initialization function of node 'DocumentTransformer2' in graph 'studyCoachFor'
func newDocumentTransformer1(ctx context.Context) (tfr document.Transformer, err error) {
	// TODO Modify component configuration here.
	config := &DocumentTransformerConfig{}
	tfr = &DocumentTransformerImpl{config: config}
	return tfr, nil
}

func (impl *DocumentTransformerImpl) Transform1(ctx context.Context, src []*schema.Document, opts ...document.TransformerOption) ([]*schema.Document, error) {
	reranker := score.NewReranker()
	_ = reranker
	return src, nil
}
