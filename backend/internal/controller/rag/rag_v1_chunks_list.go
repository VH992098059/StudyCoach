package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/model/entity"
	"backend/utility"
	"context"

	v1 "backend/api/rag/v1"
)

func (c *ControllerV1) ChunksList(ctx context.Context, req *v1.ChunksListReq) (res *v1.ChunksListRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err = knowledge.EnsureDocumentBelongsToUser(ctx, userUUID, req.KnowledgeDocId); err != nil {
		return nil, err
	}
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
