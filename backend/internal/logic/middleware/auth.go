package middleware

import (
	"backend/utility"
	"strings"

	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/util/gconv"
)

// Auth jwt中间件
func Auth(r *ghttp.Request) {
	authHeader := r.Header.Get("Authorization")
	ctx := r.Context()
	if authHeader == "" {
		r.Response.WriteJsonExit(ghttp.DefaultHandlerResponse{Code: 401, Message: "未授权：缺少token", Data: nil})
		r.Exit()
		return
	}
	//分割token
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		r.Response.WriteJsonExit(ghttp.DefaultHandlerResponse{Code: 401, Message: "未授权：token格式错误", Data: nil})
		r.Exit()
		return
	}

	// 使用 JWTMap 统一验证，包括：
	// 1. JWT 签名和过期时间
	// 2. Redis 白名单检查
	// 3. Redis 黑名单检查
	claims, err := utility.JWTMap(ctx)
	if err != nil {
		r.Response.WriteJsonExit(ghttp.DefaultHandlerResponse{Code: 401, Message: err.Error(), Data: nil})
		r.Exit()
		return
	}

	// 解析用户身份并注入 ctx：下游通过 utility.UserIdentityFrom / CurrentUsername 读取，避免重复解析 JWT + 校验 Redis。
	userId := gconv.String(claims["Id"])
	// 拒绝旧版 token（UUID 迁移前 Id claim 存的是用户名/自增 ID），避免非法 uuid 值流入数据库查询
	if err := utility.ValidateUserIDFormat(userId); err != nil {
		r.Response.WriteJsonExit(ghttp.DefaultHandlerResponse{Code: 401, Message: err.Error(), Data: nil})
		r.Exit()
		return
	}
	r.SetCtx(utility.WithUserIdentity(ctx, &utility.UserIdentity{
		ID:       userId,
		Username: gconv.String(claims["Username"]),
	}))

	r.Middleware.Next()
}
