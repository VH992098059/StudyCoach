package middleware

import (
	"backend/utility"
	"backend/utility/consts"
	"fmt"
	"net/http"
	"strings"

	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/golang-jwt/jwt/v5"
)

// Auth jwt中间件
func Auth(r *ghttp.Request) {
	authHeader := r.Header.Get("Authorization")
	ctx := r.Context()
	if authHeader == "" {
		r.Response.WriteStatus(http.StatusForbidden)
		r.Exit()
		return
	}
	//分割token
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		r.Response.WriteStatus(http.StatusForbidden)
		r.Exit()
		return
	}
	//分割后的token
	tokenString := parts[1]
	//解密JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		//验证
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(consts.JwtKey), nil
	})
	claims, _ := token.Claims.(jwt.MapClaims) //通过类型断言获取map的属性
	userKey := fmt.Sprintf("user:%s", claims["Username"].(string))
	//验证JWT是否过期
	if err != nil || !token.Valid {
		r.Response.WriteJsonExit(ghttp.DefaultHandlerResponse{Code: 401, Message: "验证已过期，请重新登录", Data: nil})
		r.Exit()
		return
	}

	//检查redis是否存在JWT
	checkJWT, err := utility.CheckJWT(ctx, userKey, tokenString)
	if err != nil || !checkJWT {
		r.Response.WriteJson("验证不存在，请重新登录")
		r.Exit()
		return
	}

	//检查jwt是否存在黑名单
	checkBlack, err := utility.CheckBlackTokens(ctx, claims["Username"].(string), tokenString)
	if err != nil || checkBlack {
		r.Response.WriteJson("验证非法，请重新登录")
		r.Exit()
		return
	}
	r.Middleware.Next()
}
