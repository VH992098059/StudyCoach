package cmd

import (
	"backend/internal/controller/ai_chat"
	"backend/internal/controller/check_jwt"
	"backend/internal/controller/login"
	"backend/internal/controller/rag"
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"
	"github.com/gogf/gf/v2/os/gtime"
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

			// Health check and observability endpoints
			s.Group("/", func(group *ghttp.RouterGroup) {
				group.GET("/healthz", func(r *ghttp.Request) {
					r.Response.WriteJson(g.Map{"status": "ok", "timestamp": gtime.Now().Unix()})
				})
				group.GET("/readyz", func(r *ghttp.Request) {
					// Basic readiness check - can be enhanced to check DB/Redis connectivity
					r.Response.WriteJson(g.Map{"status": "ready", "timestamp": gtime.Now().Unix()})
				})
				group.GET("/metrics", func(r *ghttp.Request) {
					// Placeholder for Prometheus metrics - will be enhanced
					r.Response.Write("# HELP http_requests_total Total HTTP requests\n")
					r.Response.Write("# TYPE http_requests_total counter\n")
					r.Response.Write("http_requests_total 1\n")
				})
			})

			// Debug endpoints for performance profiling
			s.Group("/debug", func(group *ghttp.RouterGroup) {
				group.ALL("/pprof/*", func(r *ghttp.Request) {
					r.Response.Write("pprof endpoints available")
				})
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
					rag.NewV1(),
				)

				// Add WebSocket endpoint
				group.GET("/ws", func(r *ghttp.Request) {
					// Placeholder for WebSocket upgrade - will reference ws.WsHandler
					r.Response.Write("WebSocket endpoint")
				})
			})

			s.Run()
			return nil
		},
	}
)
