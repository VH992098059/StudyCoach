package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/model/entity"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) ChunksList(ctx context.Context, req *v1.ChunksListReq) (res *v1.ChunksListRes, err error) {
	chunks, total, err := knowledge.GetChunksList(ctx, entity.KnowledgeChunks{
		KnowledgeDocId: req.KnowledgeDocId,
	}, req.Size, req.Page)
	if err != nil {
		return
	}
	return &v1.ChunksListRes{
		Data:  chunks,
		Total: total,
		Page:  req.Page,
		Size:  req.Size,
	}, err
}
