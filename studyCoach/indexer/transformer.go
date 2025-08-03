package indexer

import (
	"context"
	"github.com/cloudwego/eino-ext/components/document/transformer/splitter/markdown"
	"github.com/cloudwego/eino-ext/components/document/transformer/splitter/recursive"
	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/schema"
)

type DocumentTransformerImpl struct {
	config *DocumentTransformerConfig
}

type DocumentTransformerConfig struct {
}
type Transformer struct {
	markdown  document.Transformer
	recursive document.Transformer
}

// newDocumentTransformer component initialization function of node 'CustomDocumentTransformer1' in graph 'indexer'
func newDocumentTransformer(ctx context.Context) (tfr document.Transformer, err error) {
	// TODO Modify component configuration here.
	config := &recursive.Config{
		ChunkSize:   1000,
		OverlapSize: 100,
		Separators:  []string{"\n\n", "\n", "。", "！", "？"},
	}
	splitter, err := recursive.NewSplitter(ctx, config)
	if err != nil {
		return nil, err
	}
	md, err := markdown.NewHeaderSplitter(ctx, &markdown.HeaderConfig{
		Headers: map[string]string{
			"#":      "h1",
			"##":     "h2",
			"###":    "h3",
			"####":   "h4",
			"#####":  "h5",
			"######": "h6",
		},
		TrimHeaders: false,
	})
	if err != nil {
		return nil, err
	}
	transformerFile := &Transformer{}
	transformerFile.recursive = splitter
	transformerFile.markdown = md
	return transformerFile, nil
}

func (impl *Transformer) Transform(ctx context.Context, src []*schema.Document, opts ...document.TransformerOption) ([]*schema.Document, error) {
	isMd := false
	for _, doc := range src {
		if doc.MetaData["_extension"] == ".md" {
			isMd = true
			break
		}
	}
	//为true时转换
	if isMd {
		return impl.recursive.Transform(ctx, src, opts...)
	}
	//否则返回错误
	return impl.recursive.Transform(ctx, src, opts...)
}
