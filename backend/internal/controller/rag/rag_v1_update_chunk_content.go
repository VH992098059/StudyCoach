package rag

import (
	"context"

	"backend/api/rag/v1"
	"backend/internal/logic/knowledge"
	"backend/utility"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) UpdateChunkContent(ctx context.Context, req *v1.UpdateChunkContentReq) (res *v1.UpdateChunkContentRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	chunk, err := knowledge.GetChunkById(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	if chunk.Id == 0 {
		return nil, gerror.NewCode(gcode.CodeNotFound, "切片不存在")
	}
	if err = knowledge.EnsureDocumentBelongsToUser(ctx, userUUID, chunk.KnowledgeDocId); err != nil {
		return nil, err
	}
	if err = knowledge.UpdateChunkContentById(ctx, req.Id, req.Content); err != nil {
		return nil, err
	}
	return &v1.UpdateChunkContentRes{}, nil
}
