package rag

import (
	"backend/internal/dao"
	"backend/utility"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBDelete(ctx context.Context, req *v1.KBDeleteReq) (res *v1.KBDeleteRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	_, err = dao.KnowledgeBase.Ctx(ctx).WherePri(req.Id).Where(dao.KnowledgeBase.Columns().UserUuid, userUUID).Delete()
	return
}
