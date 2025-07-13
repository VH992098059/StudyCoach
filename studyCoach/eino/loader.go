package eino

import (
	"context"
	"github.com/cloudwego/eino-ext/components/document/loader/file"
	urlNewLoader "github.com/cloudwego/eino-ext/components/document/loader/url"
	"github.com/cloudwego/eino-ext/components/document/parser/html"
	"github.com/cloudwego/eino-ext/components/document/parser/pdf"
	"github.com/cloudwego/eino/components/document/parser"
	"net/url"
	"studyCoach/studyCoach/common"

	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/schema"
)

type FileUrlConfig struct {
	file document.Loader
	url  document.Loader
}

// newLoader component initialization function of node 'StudyLoader' in graph 'studyCoachFor'
func newLoader(ctx context.Context) (ld document.Loader, err error) {
	// TODO Modify component configuration here.
	fileAndUrl := &FileUrlConfig{}
	//解析文档内容
	textParser := parser.TextParser{}

	htmlParser, _ := html.NewParser(ctx, &html.Config{
		Selector: common.TypeOf("body"), //选择html中的body标签
	})
	pdfParser, _ := pdf.NewPDFParser(ctx, &pdf.Config{}) //解析pdf
	extParser, _ := parser.NewExtParser(ctx, &parser.ExtParserConfig{
		// 注册特定扩展名的解析器
		Parsers: map[string]parser.Parser{
			".html": htmlParser,
			".pdf":  pdfParser,
		},
		// 设置默认解析器，用于处理未知格式
		FallbackParser: textParser,
	})
	fileLoader, err := file.NewFileLoader(ctx, &file.FileLoaderConfig{
		UseNameAsID: true,
		Parser:      extParser,
	})
	if err != nil {
		return nil, err
	}
	fileAndUrl.file = fileLoader
	urlLoader, err := urlNewLoader.NewLoader(ctx, &urlNewLoader.LoaderConfig{})
	if err != nil {
		return nil, err
	}
	fileAndUrl.url = urlLoader
	return fileAndUrl, nil
}

// Load 加载链接和文档
func (impl *FileUrlConfig) Load(ctx context.Context, src document.Source, opts ...document.LoaderOption) ([]*schema.Document, error) {
	_, err := url.Parse(src.URI)
	if err != nil {
		return impl.url.Load(ctx, src, opts...)
	}
	return impl.url.Load(ctx, src, opts...)

}
