package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/logic/rag"
	"context"

	"github.com/gogf/gf/v2/frame/g"

	"backend/api/rag/v1"
)

func (c *ControllerV1) DocumentsDelete(ctx context.Context, req *v1.DocumentsDeleteReq) (res *v1.DocumentsDeleteRes, err error) {
	svr := rag.GetRagSvr()
	chunkList, err := knowledge.GetAllChunksByDocId(ctx, req.DocumentId, "id", "chunk_id")
	if err != nil {
		return nil, err
	}
	if len(chunkList) > 0 {
		for _, chunk := range chunkList {
			if chunk.ChunkId != "" {
				err = svr.DeleteDocument(ctx, chunk.ChunkId)
				if err != nil {
					g.Log().Errorf(ctx, "DeleteDocumentAndChunks: ES DeleteByQuery failed for docId %v, err: %v", chunk.ChunkId, err)
					return
				}

			}
		}
	}
	err = knowledge.DeleteDocument(ctx, req.DocumentId)
	return
}
