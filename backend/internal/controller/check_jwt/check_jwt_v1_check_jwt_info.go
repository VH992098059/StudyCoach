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
	claims, _ := token.Claims.(jwt.MapClaims) //通过类型断言获取map的属性
	userKey := fmt.Sprintf("user:%s", claims["Username"].(string))
	checkJWT, err := utility.CheckJWT(ctx, userKey, getJwt)
	if err != nil {
		return nil, err
	}
	checkJWTBlack, err := utility.CheckBlackTokens(ctx, claims["Username"].(string), getJwt)
	log.Println("验证token是否在redis黑名单：", checkJWTBlack)
	if err != nil {
		log.Fatal("check_jwt出错")
		return nil, err
	}
	if !checkJWT || checkJWTBlack {
		return nil, gerror.NewCode(gcode.CodeInvalidParameter, "token已失效或不存在")
	}
	return &v1.CheckJwtInfoRes{
		Msg: "验证成功",
	}, nil
}
