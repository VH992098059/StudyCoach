package rag

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBCreate(ctx context.Context, req *v1.KBCreateReq) (res *v1.KBCreateRes, err error) {
	insertId, err := dao.KnowledgeBase.Ctx(ctx).Data(do.KnowledgeBase{
		Name:        req.Name,
		Status:      v1.StatusOK,
		Description: req.Description,
		Category:    req.Category,
	}).InsertAndGetId()
	if err != nil {
		return nil, err
	}
	res = &v1.KBCreateRes{
		Id: insertId,
	}
	return
}
