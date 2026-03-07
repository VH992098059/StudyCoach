package api

import (
	"backend/studyCoach/common"
	"context"

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
	ids, err = x.idxer.Invoke(ctx, s)
	if err != nil {
		g.Log().Errorf(ctx, "Index idxer.Invoke failed, err:\n%v", err)
		return
	}
	g.Log().Infof(ctx, "Index success, generated %d chunks with IDs: %v", len(ids), ids)
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
