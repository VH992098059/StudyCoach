package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/logic/rag"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) ChunkDelete(ctx context.Context, req *v1.ChunkDeleteReq) (res *v1.ChunkDeleteRes, err error) {
	svr := rag.GetRagSvr()
	chunk, err := knowledge.GetChunkById(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	err = svr.DeleteDocument(ctx, chunk.ChunkId)
	if err != nil {
		return nil, err
	}
	err = knowledge.DeleteChunkById(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return
}
