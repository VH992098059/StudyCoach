package indexer

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino-ext/components/document/parser/xlsx"

	"github.com/cloudwego/eino-ext/components/document/parser/html"
	"github.com/cloudwego/eino/components/document/parser"
)

func newParser(ctx context.Context) (p parser.Parser, err error) {
	textParser := parser.TextParser{}

	htmlParser, err := html.NewParser(ctx, &html.Config{
		Selector: common.TypeOf("body"),
	})
	if err != nil {
		return nil, err
	}
	xlsxParser, err := xlsx.NewXlsxParser(ctx, nil)
	if err != nil {
		return nil, err
	}

	// PDF 不在此解析：索引前由 MinerU 转为 Markdown 后再走 Loader（见 rag Indexer 与 mineruworker）。
	// 创建扩展解析器
	p, err = parser.NewExtParser(ctx, &parser.ExtParserConfig{
		// 注册特定扩展名的解析器
		Parsers: map[string]parser.Parser{
			".html": htmlParser,
			".xlsx": xlsxParser,
		},
		// 设置默认解析器，用于处理未知格式
		FallbackParser: textParser,
	})
	if err != nil {
		return nil, err
	}
	return
}
