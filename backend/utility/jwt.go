package utility

import (
	"backend/utility/consts"
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/golang-jwt/jwt/v5"

	"strings"
)

// JwtClaims 定义自定义 JWT 载荷结构
type JwtClaims struct {
	Id       uint64
	Username string
	jwt.RegisteredClaims
}

// Decryption 身份验证解密
func Decryption(token string, claims jwt.Claims) (*jwt.Token, error) {
	withClaims, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			msg := fmt.Errorf("unexpected signing method: %v", token.Header["alg"]).Error()
			return nil, gerror.NewCode(gcode.New(500, msg, nil))
		}
		return []byte(consts.JwtKey), nil
	})
	if err != nil {
		return nil, err
	}
	if !withClaims.Valid {
		return nil, gerror.NewCode(gcode.New(500, "验证无效", nil))
	}
	return withClaims, nil
}

// GetJWT 获取身份验证
func GetJWT(ctx context.Context) (token string) {
	// 使用从 Header 绑定的 req.Token，并移除 "Bearer " 前缀
	token = g.RequestFromCtx(ctx).Request.Header.Get("Authorization")
	if strings.HasPrefix(token, "Bearer ") {
		token = strings.TrimPrefix(token, "Bearer ")
	}
	return
}

func JWTMap(ctx context.Context) (claims jwt.MapClaims, err error) {
	getJwt := GetJWT(ctx)
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
	return token.Claims.(jwt.MapClaims), nil
}
