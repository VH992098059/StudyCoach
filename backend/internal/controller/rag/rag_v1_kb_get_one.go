package rag

import (
	"backend/internal/dao"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBGetOne(ctx context.Context, req *v1.KBGetOneReq) (res *v1.KBGetOneRes, err error) {
	res = &v1.KBGetOneRes{}
	err = dao.KnowledgeBase.Ctx(ctx).WherePri(req.Id).Scan(&res.KnowledgeBase)
	return
}
