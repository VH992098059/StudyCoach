package rag

import (
	"backend/internal/dao"
	"backend/utility"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBGetOne(ctx context.Context, req *v1.KBGetOneReq) (res *v1.KBGetOneRes, err error) {
	res = &v1.KBGetOneRes{}
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	err = dao.KnowledgeBase.Ctx(ctx).WherePri(req.Id).Where(dao.KnowledgeBase.Columns().UserUuid, userUUID).Scan(&res.KnowledgeBase)
	return
}
