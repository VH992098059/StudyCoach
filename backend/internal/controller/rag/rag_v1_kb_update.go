package rag

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBUpdate(ctx context.Context, req *v1.KBUpdateReq) (res *v1.KBUpdateRes, err error) {
	_, err = dao.KnowledgeBase.Ctx(ctx).Data(do.KnowledgeBase{
		Name:        req.Name,
		Status:      req.Status,
		Description: req.Description,
		Category:    req.Category,
	}).WherePri(req.Id).Update()
	return
}
