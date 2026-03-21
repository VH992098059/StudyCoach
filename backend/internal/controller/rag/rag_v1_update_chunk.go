package rag

import (
	"context"

	"backend/api/rag/v1"
	"backend/internal/logic/knowledge"
	"backend/utility"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) UpdateChunk(ctx context.Context, req *v1.UpdateChunkReq) (res *v1.UpdateChunkRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	for _, id := range req.Ids {
		chunk, e := knowledge.GetChunkById(ctx, id)
		if e != nil {
			return nil, e
		}
		if chunk.Id == 0 {
			return nil, gerror.NewCode(gcode.CodeNotFound, "切片不存在")
		}
		if err = knowledge.EnsureDocumentBelongsToUser(ctx, userUUID, chunk.KnowledgeDocId); err != nil {
			return nil, err
		}
	}
	if err = knowledge.UpdateChunksStatus(ctx, req.Ids, req.Status); err != nil {
		return nil, err
	}
	return &v1.UpdateChunkRes{}, nil
}
