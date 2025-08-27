package rag

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBGetList(ctx context.Context, req *v1.KBGetListReq) (res *v1.KBGetListRes, err error) {
	res = &v1.KBGetListRes{}
	err = dao.KnowledgeBase.Ctx(ctx).Where(do.KnowledgeBase{
		Status:   req.Status,
		Name:     req.Name,
		Category: req.Category,
	}).Scan(&res.List)
	return
}
