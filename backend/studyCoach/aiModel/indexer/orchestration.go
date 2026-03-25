package indexer

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino/compose"
)

// BuildIndexer 构建索引管线。onIndexed 非空时在向量库写入后执行（QA 生成 + 状态更新）。
func BuildIndexer(ctx context.Context, conf *common.Config, onIndexed OnIndexedCallback) (r compose.Runnable[any, []string], err error) {
	const (
		Loader1              = "Loader"
		Indexer2             = "Indexer"
		DocumentTransformer3 = "DocumentTransformer"
		DocAddIDAndMerge     = "DocAddIDAndMerge"
	)

	g := compose.NewGraph[any, []string]()
	loader1KeyOfLoader, err := newLoader(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLoaderNode(Loader1, loader1KeyOfLoader)
	innerIndexer, err := newIndexer(ctx, conf)
	if err != nil {
		return nil, err
	}
	indexer2KeyOfIndexer := innerIndexer
	if onIndexed != nil {
		indexer2KeyOfIndexer = wrapIndexerWithChunks(innerIndexer, onIndexed)
	}
	_ = g.AddIndexerNode(Indexer2, indexer2KeyOfIndexer)
	documentTransformer2KeyOfDocumentTransformer, err := newDocumentTransformer(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(DocAddIDAndMerge, compose.InvokableLambda(addDocIDAndMerge))
	// _ = g.AddLambdaNode(QA, compose.InvokableLambda(qa)) // qa 异步 执行

	_ = g.AddDocumentTransformerNode(DocumentTransformer3, documentTransformer2KeyOfDocumentTransformer)
	_ = g.AddEdge(compose.START, Loader1)
	_ = g.AddEdge(Loader1, DocumentTransformer3)
	_ = g.AddEdge(DocumentTransformer3, DocAddIDAndMerge)
	_ = g.AddEdge(DocAddIDAndMerge, Indexer2)
	// _ = g.AddEdge(DocAddIDAndMerge, QA)
	// _ = g.AddEdge(QA, Indexer2)
	_ = g.AddEdge(Indexer2, compose.END)
	r, err = g.Compile(ctx, compose.WithGraphName("indexer"))
	if err != nil {
		return nil, err
	}
	return r, err
}
