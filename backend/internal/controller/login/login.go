package login

import (
	v1 "backend/api/login/v1"
	"backend/internal/logic/login"
	"backend/internal/model/entity"
	"context"
)

func (c *ControllerV1) Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error) {
	id, uuid, token, err := login.Login(ctx, req.Username, req.Password)
	if err != nil {
		return nil, err
	}
	return &v1.LoginRes{
		Id:    id,
		Uuid:  uuid,
		Token: token,
	}, nil
}

func (c *ControllerV1) Register(ctx context.Context, req *v1.RegisterReq) (res *v1.RegisterRes, err error) {
	id, err := login.RegisterUser(ctx, &entity.Users{
		Username: req.Username,
		Password: req.Password,
		Email:    req.Email,
	})
	if err != nil {
		return nil, err
	}
	return &v1.RegisterRes{
		Id: id,
	}, err
}
