package rag

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/utility"
	"context"

	"backend/api/rag/v1"

	"github.com/google/uuid"
)

func (c *ControllerV1) KBCreate(ctx context.Context, req *v1.KBCreateReq) (res *v1.KBCreateRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	// UUID 主键无自增序列：Go 侧预生成 ID
	kbId := uuid.NewString()
	_, err = dao.KnowledgeBase.Ctx(ctx).Data(do.KnowledgeBase{
		Id:          kbId,
		UserUuid:    userUUID,
		Name:        req.Name,
		Status:      v1.StatusOK,
		Description: req.Description,
		Category:    req.Category,
	}).Insert()
	if err != nil {
		return nil, err
	}
	res = &v1.KBCreateRes{
		Id: kbId,
	}
	return
}
