package api

import (
	"backend/studyCoach/common"
	"context"
	"time"

	"github.com/cloudwego/eino/components/document"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

type IndexReq struct {
	URI           string // 文档地址，可以是文件路径（pdf，html，md等），也可以是网址
	KnowledgeName string // 知识库名称
	DocumentsId   int64  // 文档ID
}

type IndexAsyncReq struct {
	Docs          []*schema.Document
	KnowledgeName string // 知识库名称
	DocumentsId   int64  // 文档ID
}

// Index
// 文档读取、分割、合并后，并行写入向量库与 MySQL chunks；QA 由 indexer 包装器异步触发。
// 不再依赖「向量库回查」，chunks 与 QA 均基于内存中的 docs。
func (x *Rag) Index(ctx context.Context, req *IndexReq) (ids []string, err error) {
	s := document.Source{
		URI: req.URI,
	}
	ctx = context.WithValue(ctx, common.KnowledgeName, req.KnowledgeName)
	ctx = context.WithValue(ctx, common.DocumentsIdKey, req.DocumentsId)
	start := time.Now()
	g.Log().Infof(ctx, "Index start: uri=%s knowledge=%s documentsId=%d (含 PDF 解析、切分、Embedding 批量写入，大文件或 chunk 多时会较慢)", req.URI, req.KnowledgeName, req.DocumentsId)
	ids, err = x.idxer.Invoke(ctx, s)
	if err != nil {
		g.Log().Errorf(ctx, "Index idxer.Invoke failed after %v, err:\n%v", time.Since(start), err)
		return
	}
	sample := ids
	if len(sample) > 5 {
		sample = sample[:5]
	}
	g.Log().Infof(ctx, "Index success in %v, chunk count=%d, ids (前至多5个): %v", time.Since(start), len(ids), sample)
	return
}

// IndexAsync
// 通过 schema.Document 异步 生成QA&embedding
func (x *Rag) IndexAsync(ctx context.Context, req *IndexAsyncReq) (ids []string, err error) {
	ctx = context.WithValue(ctx, common.KnowledgeName, req.KnowledgeName)
	ids, err = x.idxerAsync.Invoke(ctx, req.Docs)
	if err != nil {
		return
	}

	return
}

func (x *Rag) DeleteDocument(ctx context.Context, documentID string) error {
	return x.conf.DeleteDocument(ctx, documentID)
}
