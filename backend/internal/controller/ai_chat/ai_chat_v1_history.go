package ai_chat

import (
	v1 "backend/api/ai_chat/v1"
	logic "backend/internal/logic/ai_chat"
	"backend/utility"
	"context"

	"github.com/gogf/gf/v2/util/gconv"
)

func (c *ControllerV1) SaveSession(ctx context.Context, req *v1.SaveSessionReq) (res *v1.SaveSessionRes, err error) {
	claims, err := utility.JWTMap(ctx)
	if err != nil {
		return nil, err
	}
	userId := gconv.String(claims["Username"])

	newId, err := logic.GetChat().SaveSession(ctx, userId, req)
	if err != nil {
		return nil, err
	}
	return &v1.SaveSessionRes{Id: newId}, nil
}

func (c *ControllerV1) GetHistory(ctx context.Context, req *v1.GetHistoryReq) (res *v1.GetHistoryRes, err error) {
	claims, err := utility.JWTMap(ctx)
	if err != nil {
		return nil, err
	}
	userId := gconv.String(claims["Username"])

	list, err := logic.GetChat().GetHistory(ctx, userId)
	if err != nil {
		return nil, err
	}
	return &v1.GetHistoryRes{List: list}, nil
}

func (c *ControllerV1) GetSession(ctx context.Context, req *v1.GetSessionReq) (res *v1.GetSessionRes, err error) {
	claims, err := utility.JWTMap(ctx)
	if err != nil {
		return nil, err
	}
	userId := gconv.String(claims["Username"])

	res, err = logic.GetChat().GetSession(ctx, userId, req.Id)
	return
}

func (c *ControllerV1) DeleteSession(ctx context.Context, req *v1.DeleteSessionReq) (res *v1.DeleteSessionRes, err error) {
	claims, err := utility.JWTMap(ctx)
	if err != nil {
		return nil, err
	}
	userId := gconv.String(claims["Username"])

	err = logic.GetChat().DeleteSession(ctx, userId, req.Id)
	if err != nil {
		return nil, err
	}
	return &v1.DeleteSessionRes{Id: req.Id}, nil
}
