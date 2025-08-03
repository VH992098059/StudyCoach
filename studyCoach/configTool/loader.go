package configTool

import (
	"context"
	"github.com/cloudwego/eino-ext/components/document/loader/file"
	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/components/document/parser"
)

func NewLoader(ctx context.Context) (ldr document.Loader, err error) {

	textParser := parser.TextParser{}
	config := &file.FileLoaderConfig{
		UseNameAsID: true,
		Parser:      textParser,
	}
	ldr, err = file.NewFileLoader(ctx, config)
	if err != nil {
		return nil, err
	}
	return ldr, nil
}
