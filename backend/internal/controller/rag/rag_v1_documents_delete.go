package rag

import (
	"backend/internal/logic/knowledge"
	"backend/utility"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) DocumentsDelete(ctx context.Context, req *v1.DocumentsDeleteReq) (res *v1.DocumentsDeleteRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err = knowledge.EnsureDocumentBelongsToUser(ctx, userUUID, req.DocumentId); err != nil {
		return nil, err
	}
	err = knowledge.DeleteDocument(ctx, req.DocumentId)
	if err != nil {
		return nil, err
	}
	return &v1.DocumentsDeleteRes{}, err
}
