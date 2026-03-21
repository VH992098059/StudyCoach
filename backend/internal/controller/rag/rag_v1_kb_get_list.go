package rag

import (
	"backend/internal/dao"
	"backend/utility"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBGetList(ctx context.Context, req *v1.KBGetListReq) (res *v1.KBGetListRes, err error) {
	res = &v1.KBGetListRes{}
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	m := dao.KnowledgeBase.Ctx(ctx).Where(dao.KnowledgeBase.Columns().UserUuid, userUUID)
	if req.Name != nil {
		m = m.Where(dao.KnowledgeBase.Columns().Name, *req.Name)
	}
	if req.Status != nil {
		m = m.Where(dao.KnowledgeBase.Columns().Status, *req.Status)
	}
	if req.Category != nil {
		m = m.Where(dao.KnowledgeBase.Columns().Category, *req.Category)
	}
	err = m.Scan(&res.List)
	return
}
