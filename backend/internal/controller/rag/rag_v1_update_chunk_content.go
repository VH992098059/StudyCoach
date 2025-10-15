package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/logic/rag"
	"backend/internal/model/entity"
	"backend/studyCoach/api"
	"context"
	"time"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"

	"backend/api/rag/v1"
)

func (c *ControllerV1) UpdateChunkContent(ctx context.Context, req *v1.UpdateChunkContentReq) (res *v1.UpdateChunkContentRes, err error) {
	chunk, err := knowledge.GetChunkById(ctx, req.Id)
	if err != nil {
		g.Log().Errorf(ctx, "GetChunkByid err=%v", err)
		return
	}
	document, err := knowledge.GetDocumentById(ctx, chunk.KnowledgeDocId)
	if err != nil {
		g.Log().Errorf(ctx, "GetDocumentById err=%v", err)
		return
	}
	knowledgeName := document.KnowledgeBaseName

	err = knowledge.UpdateChunkByIds(ctx, []int64{req.Id}, entity.KnowledgeChunks{Content: req.Content})
	if err != nil {
		g.Log().Errorf(ctx, "UpdateChunkByIds err=%v", err)
		return
	}
	go func() {
		time.Sleep(time.Millisecond * 500)
		ctxNew := gctx.New()
		defer func() {
			if e := recover(); e != nil {
				g.Log().Errorf(ctxNew, "reccover updateChunkContent err=%v", e)
			}
		}()

		doc := &schema.Document{
			ID:      chunk.ChunkId,
			Content: req.Content,
		}
		if chunk.Ext != "" {
			extData := map[string]any{}
			if err = sonic.Unmarshal([]byte(chunk.Ext), &extData); err == nil {
				doc.MetaData = extData
			}
		}

		//调用异步索引更新
		ragSvr := rag.GetRagSvr()
		asyncReq := &api.IndexAsyncReq{
			Docs:          []*schema.Document{doc},
			KnowledgeName: knowledgeName,
			DocumentsId:   chunk.KnowledgeDocId,
		}
		_, err = ragSvr.IndexAsync(ctxNew, asyncReq)
		if err != nil {
			g.Log().Errorf(ctxNew, "IndexAsync err=%v", err)
		} else {
			g.Log().Infof(ctxNew, "Chunk content updated and reindexed successfully, chunk_id=%d", req.Id)
		}
	}()
	return
}
