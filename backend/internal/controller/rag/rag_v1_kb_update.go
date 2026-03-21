package rag

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/utility"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) KBUpdate(ctx context.Context, req *v1.KBUpdateReq) (res *v1.KBUpdateRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	_, err = dao.KnowledgeBase.Ctx(ctx).Data(do.KnowledgeBase{
		Name:        req.Name,
		Status:      req.Status,
		Description: req.Description,
		Category:    req.Category,
	}).WherePri(req.Id).Where(dao.KnowledgeBase.Columns().UserUuid, userUUID).Update()
	return
}
