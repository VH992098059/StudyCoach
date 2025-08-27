package rag

import (
	"backend/internal/dao"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBDelete(ctx context.Context, req *v1.KBDeleteReq) (res *v1.KBDeleteRes, err error) {
	_, err = dao.KnowledgeBase.Ctx(ctx).WherePri(req.Id).Delete()
	return
}
