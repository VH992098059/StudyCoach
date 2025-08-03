package indexer

import (
	"context"
	"github.com/cloudwego/eino/compose"
	"studyCoach/studyCoach/configTool"
)

func Buildindexer(ctx context.Context, conf *configTool.Config) (r compose.Runnable[any, []string], err error) {
	const (
		CustomDocumentTransformer1 = "CustomDocumentTransformer1"
		CustomLoader2              = "CustomLoader2"
		IndexerEs                  = "IndexerEs"
	)
	g := compose.NewGraph[any, []string]()
	customDocumentTransformer1KeyOfDocumentTransformer, err := newDocumentTransformer(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddDocumentTransformerNode(CustomDocumentTransformer1, customDocumentTransformer1KeyOfDocumentTransformer)
	customLoader2KeyOfLoader, err := newLoader(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLoaderNode(CustomLoader2, customLoader2KeyOfLoader)
	indexerEsKeyOfIndexer, err := newIndexer(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddIndexerNode(IndexerEs, indexerEsKeyOfIndexer)
	_ = g.AddEdge(compose.START, CustomLoader2)
	_ = g.AddEdge(IndexerEs, compose.END)
	_ = g.AddEdge(CustomLoader2, CustomDocumentTransformer1)
	_ = g.AddEdge(CustomDocumentTransformer1, IndexerEs)
	r, err = g.Compile(ctx, compose.WithGraphName("indexer"))
	if err != nil {
		return nil, err
	}
	return r, err
}
