package indexer

import (
	"backend/internal/logic/knowledge"
	"backend/internal/model/entity"
	"backend/studyCoach/aiModel/indexer/docmeta"
	"backend/studyCoach/common"
	"context"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
)

// OnIndexedCallback 索引完成后的回调，用于异步 QA 生成与状态更新。
// 参数：ctx（含 KnowledgeName）、docs、documentsId。
type OnIndexedCallback func(ctx context.Context, docs []*schema.Document, documentsId int64)

// wrapIndexerWithChunks 包装 indexer：在写入向量库前落库 MySQL chunks，写入后触发 QA 回调。
// 去掉「向量库回查」：chunks 与 QA 均基于内存中的 docs，不再依赖 SearchDocumentsByIDs。
func wrapIndexerWithChunks(inner indexer.Indexer, onIndexed OnIndexedCallback) indexer.Indexer {
	return &indexerWithChunks{inner: inner, onIndexed: onIndexed}
}

type indexerWithChunks struct {
	inner     indexer.Indexer
	onIndexed OnIndexedCallback
}

func (w *indexerWithChunks) Store(ctx context.Context, docs []*schema.Document, opts ...indexer.Option) ([]string, error) {
	documentsId, _ := ctx.Value(common.DocumentsIdKey).(int64)
	if documentsId > 0 && len(docs) > 0 {
		chunks := make([]entity.KnowledgeChunks, 0, len(docs))
		for _, doc := range docs {
			ext, err := sonic.Marshal(docmeta.GetExtData(doc))
			if err != nil {
				g.Log().Errorf(ctx, "wrapIndexerWithChunks marshal ext failed, err=%v", err)
				continue
			}
			chunks = append(chunks, entity.KnowledgeChunks{
				Id:             0,
				KnowledgeDocId: documentsId,
				ChunkId:        doc.ID,
				Content:        doc.Content,
				Ext:            string(ext),
				Status:         knowledge.ChunkStatusActive, // 与 DB default:1 及前端「启用」一致
			})
		}
		if len(chunks) > 0 {
			if err := knowledge.SaveChunksData(ctx, documentsId, chunks); err != nil {
				g.Log().Errorf(ctx, "wrapIndexerWithChunks SaveChunksData failed, err=%v", err)
			}
		}
	}

	ids, err := w.inner.Store(ctx, docs, opts...)
	if err != nil {
		return nil, err
	}

	if w.onIndexed != nil && len(docs) > 0 && documentsId > 0 {
		knowledgeName, _ := ctx.Value(common.KnowledgeName).(string)
		docsCopy := make([]*schema.Document, len(docs))
		copy(docsCopy, docs)
		go func() {
			ctxN := gctx.New()
			ctxN = context.WithValue(ctxN, common.KnowledgeName, knowledgeName)
			w.onIndexed(ctxN, docsCopy, documentsId)
		}()
	}

	return ids, nil
}

func (w *indexerWithChunks) GetType() string {
	return "indexer_with_chunks"
}
