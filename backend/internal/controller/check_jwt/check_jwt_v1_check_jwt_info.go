package check_jwt

import (
	v1 "backend/api/check_jwt/v1"
	"backend/utility"
	"backend/utility/consts"
	"context"
	"fmt"
	"log"

	"github.com/golang-jwt/jwt/v5"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
)

func (c *ControllerV1) CheckJwtInfo(ctx context.Context, req *v1.CheckJwtInfoReq) (res *v1.CheckJwtInfoRes, err error) {
	getJwt := utility.GetJWT(ctx)
	if getJwt == "" {
		err = gerror.NewCode(gcode.CodeInvalidParameter, "token is empty")
		return nil, err
	}
	//解密JWT
	token, err := jwt.Parse(getJwt, func(token *jwt.Token) (interface{}, error) {
		//验证
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(consts.JwtKey), nil
	})
	if err != nil || !token.Valid {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token已失效或不存在")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token claims 无效")
	}
	username, ok := claims["Username"].(string)
	if !ok || username == "" {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token中缺少用户名")
	}
	userKey := fmt.Sprintf("user:%s", username)
	checkJWT, err := utility.CheckJWT(ctx, userKey, getJwt)
	if err != nil {
		return nil, err
	}
	checkJWTBlack, err := utility.CheckBlackTokens(ctx, username, getJwt)
	log.Println("验证token是否在redis黑名单：", checkJWTBlack)
	if err != nil {
		log.Printf("check_jwt出错: %v", err)
		return nil, gerror.NewCode(gcode.CodeInternalError, "验证失败")
	}
	if !checkJWT || checkJWTBlack {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token已失效或不存在")
	}
	return &v1.CheckJwtInfoRes{
		Msg: "验证成功",
	}, nil
}
