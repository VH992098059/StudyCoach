package ai_chat

import (
	v1 "backend/api/ai_chat/v1"
	logic "backend/internal/logic/ai_chat"
	"backend/utility"
	"context"
)

func (c *ControllerV1) SaveSession(ctx context.Context, req *v1.SaveSessionReq) (res *v1.SaveSessionRes, err error) {
	userId, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}

	newId, err := logic.GetChat().SaveSession(ctx, userId, req)
	if err != nil {
		return nil, err
	}
	return &v1.SaveSessionRes{Id: newId}, nil
}

func (c *ControllerV1) GetHistory(ctx context.Context, req *v1.GetHistoryReq) (res *v1.GetHistoryRes, err error) {
	userId, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}

	list, total, err := logic.GetChat().GetHistory(ctx, userId, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}
	return &v1.GetHistoryRes{
		List:     list,
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	}, nil
}

func (c *ControllerV1) GetSession(ctx context.Context, req *v1.GetSessionReq) (res *v1.GetSessionRes, err error) {
	userId, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}

	res, err = logic.GetChat().GetSession(ctx, userId, req.Id, req.BeforeTimestamp, req.Limit)
	return
}

func (c *ControllerV1) DeleteSession(ctx context.Context, req *v1.DeleteSessionReq) (res *v1.DeleteSessionRes, err error) {
	userId, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}

	err = logic.GetChat().DeleteSession(ctx, userId, req.Id)
	if err != nil {
		return nil, err
	}
	return &v1.DeleteSessionRes{Id: req.Id}, nil
}
