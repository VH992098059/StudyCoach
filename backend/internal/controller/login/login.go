package login

import (
	v1 "backend/api/login/v1"
	"backend/internal/logic/login"
	"backend/internal/model/entity"
	"backend/utility"
	"backend/utility/consts"
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/golang-jwt/jwt/v5"
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

func (c *ControllerV1) UpdatePassword(ctx context.Context, req *v1.UpdatePasswordReq) (res *v1.UpdatePasswordRes, err error) {
	// 1. Get Token
	tokenStr := utility.GetJWT(ctx)
	if tokenStr == "" {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "未登录")
	}

	// 2. Parse Token
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(consts.JwtKey), nil
	})
	if err != nil {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "无效的Token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "无效的Token Claims")
	}

	username, ok := claims["Username"].(string)
	if !ok {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "Token中缺少用户名")
	}

	// 3. Call Logic
	err = login.UpdatePassword(ctx, username, req.OldPassword, req.NewPassword)
	if err != nil {
		return nil, err
	}

	return &v1.UpdatePasswordRes{
		Msg: "密码修改成功",
	}, nil
}
