package cmd

import (
	"backend/internal/controller/ai_chat"
	"backend/internal/controller/check_jwt"
	"backend/internal/controller/login"
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"
)

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			s := g.Server()
			//是否允许跨域操作
			s.Use(func(r *ghttp.Request) {
				r.Response.CORSDefault()
				r.Middleware.Next()
			})
			s.Group("/gateway", func(group *ghttp.RouterGroup) {
				group.Middleware(ghttp.MiddlewareHandlerResponse)
				group.Bind(
					check_jwt.NewV1(),
					login.LoginController,
				)
				////中间件拦截
				//group.Middleware(middleware.Auth)
				group.Bind(
					ai_chat.NewV1(),
				)
			})

			s.Run()
			return nil
		},
	}
)
