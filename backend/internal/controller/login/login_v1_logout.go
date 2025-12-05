package login

import (
	"backend/internal/logic/login"
	"context"

	"backend/api/login/v1"
)

func (c *ControllerV1) Logout(ctx context.Context, req *v1.LogoutReq) (res *v1.LogoutRes, err error) {
	msg, err := login.LogoutUser(ctx)
	if err != nil {
		return nil, err
	}
	return &v1.LogoutRes{Msg: msg}, nil
}
