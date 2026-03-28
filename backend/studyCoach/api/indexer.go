package api

import (
	"backend/internal/dao"
	"backend/internal/model/entity"
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
	FileName      string // 文件名
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
	ctx = context.WithValue(ctx, "_file_name", req.FileName)
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
	start := time.Now()
	g.Log().Infof(ctx, "IndexAsync start: knowledge=%s documentsId=%d docs=%d", req.KnowledgeName, req.DocumentsId, len(req.Docs))
	ids, err = x.idxerAsync.Invoke(ctx, req.Docs)
	if err != nil {
		g.Log().Errorf(ctx, "IndexAsync idxerAsync.Invoke failed after %v, err=%v", time.Since(start), err)
		return
	}
	g.Log().Infof(ctx, "IndexAsync success in %v, chunk count=%d", time.Since(start), len(ids))
	return
}

func (x *Rag) DeleteDocument(ctx context.Context, documentID string) error {
	return x.conf.DeleteDocument(ctx, documentID)
}

// GenerateQAAsync 异步生成 QA 内容并更新向量库
func (x *Rag) GenerateQAAsync(ctx context.Context, documentsId int64, knowledgeName string) error {
	// 从 MySQL 获取该文档的所有 chunks
	var chunks []*entity.KnowledgeChunks
	err := dao.KnowledgeChunks.Ctx(ctx).Where("knowledge_doc_id", documentsId).Scan(&chunks)
	if err != nil {
		g.Log().Errorf(ctx, "GenerateQAAsync: 获取 chunks 失败 documentsId=%d, err=%v", documentsId, err)
		return err
	}

	if len(chunks) == 0 {
		g.Log().Infof(ctx, "GenerateQAAsync: 文档无 chunks, documentsId=%d", documentsId)
		return nil
	}

	// 转换为 schema.Document
	docs := make([]*schema.Document, len(chunks))
	for i, chunk := range chunks {
		docs[i] = &schema.Document{
			ID:       chunk.ChunkId,
			Content:  chunk.Content,
			MetaData: map[string]any{common.KnowledgeName: knowledgeName},
		}
	}

	// 调用异步索引生成 QA
	ctx = context.WithValue(ctx, common.KnowledgeName, knowledgeName)
	_, err = x.IndexAsync(ctx, &IndexAsyncReq{
		Docs:          docs,
		KnowledgeName: knowledgeName,
		DocumentsId:   documentsId,
	})
	if err != nil {
		g.Log().Errorf(ctx, "GenerateQAAsync: IndexAsync 失败 documentsId=%d, err=%v", documentsId, err)
		return err
	}

	g.Log().Infof(ctx, "GenerateQAAsync: 完成 documentsId=%d, chunks=%d", documentsId, len(chunks))
	return nil
}
