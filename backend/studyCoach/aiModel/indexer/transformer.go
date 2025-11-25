package indexer

import (
	"backend/studyCoach/common"
	"context"
	"regexp"
	"strings"
	"unicode"

	"github.com/cloudwego/eino-ext/components/document/transformer/splitter/markdown"
	"github.com/cloudwego/eino-ext/components/document/transformer/splitter/recursive"
	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/schema"
)

func normalizeText(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	s = strings.Map(func(r rune) rune {
		if unicode.IsControl(r) && r != '\n' && r != '\t' {
			return -1
		}
		return r
	}, s)
	re := regexp.MustCompile(`([。？！?!])`)
	s = re.ReplaceAllString(s, "$1\n")
	s = regexp.MustCompile(`\n{3,}`).ReplaceAllString(s, "\n\n")
	return strings.TrimSpace(s)
}
func mostlyEnglish(s string) bool {
	letters := 0
	ascii := 0
	for _, r := range s {
		if unicode.IsLetter(r) {
			letters++
		}
		if r < 128 {
			ascii++
		}
	}
	if letters == 0 {
		return false
	}
	return float64(ascii)/float64(letters) > 0.6
}

// newDocumentTransformer component initialization function of node 'DocumentTransformer3' in graph 'rag'
func newDocumentTransformer(ctx context.Context) (tfr document.Transformer, err error) {
	trans := &transformer{}
	// 递归分割
	config := &recursive.Config{
		ChunkSize:   1000, // 每段内容1000字
		OverlapSize: 100,  // 有10%的重叠
		Separators:  []string{"\n", "。", "?", "？", "!", "！"},
	}
	recTrans, err := recursive.NewSplitter(ctx, config)
	if err != nil {
		return nil, err
	}
	// md 文档特殊处理
	mdTrans, err := markdown.NewHeaderSplitter(ctx, &markdown.HeaderConfig{
		Headers:     map[string]string{"#": common.Title1, "##": common.Title2, "###": common.Title3},
		TrimHeaders: false,
	})
	if err != nil {
		return nil, err
	}
	trans.recursive = recTrans
	trans.markdown = mdTrans
	return trans, nil
}

type transformer struct {
	markdown  document.Transformer
	recursive document.Transformer
}

func (x *transformer) Transform(ctx context.Context, docs []*schema.Document, opts ...document.TransformerOption) ([]*schema.Document, error) {
	isMd := false
	for _, doc := range docs {
		// 只需要判断第一个是不是.md
		if doc.MetaData["_extension"] == ".md" {
			isMd = true
			break
		}
	}
	if isMd {
		return x.markdown.Transform(ctx, docs, opts...)
	}
	return x.recursive.Transform(ctx, docs, opts...)
}
