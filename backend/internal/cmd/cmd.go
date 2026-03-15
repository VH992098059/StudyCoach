package cmd

import (
	"backend/internal/controller/ai_chat"
	"backend/internal/controller/check_jwt"
	"backend/internal/controller/cron"
	"backend/internal/controller/cron_execute"
	"backend/internal/controller/file_controller"
	"backend/internal/controller/files"
	"backend/internal/controller/login"
	"backend/internal/controller/rag"
	"backend/internal/controller/voice"
	"backend/internal/controller/ws"
	logicCron "backend/internal/logic/cron"
	"backend/internal/logic/middleware"
	createTable "backend/internal/model/gorm"
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"
	"github.com/gogf/gf/v2/os/gtime"
)

// WsHub 全局 WebSocket Hub，用于广播定时任务完成等通知
var WsHub *ws.Hub

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
		Brief: "start http server",
		Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
			// 启动时自动迁移：表不存在则创建，已存在则跳过
			if err := createTable.RunMigrateOnStartup(ctx); err != nil {
				g.Log().Warningf(ctx, "database migrate failed (non-fatal): %v", err)
			}

			s := g.Server()

			// 初始化 WebSocket Hub 并启动
			WsHub = ws.NewHub()
			ws.DefaultHub = WsHub
			go WsHub.Run()

			// 初始化定时任务调度器
			logicCron.InitScheduler(ctx)

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

			// WebSocket 路由（不经过 MiddlewareHandlerResponse）
			s.Group("/gateway", func(wsGroup *ghttp.RouterGroup) {
				wsGroup.GET("/ws", ws.HandleWebSocket(WsHub))
			})

			s.Group("/gateway", func(group *ghttp.RouterGroup) {
				group.Middleware(ghttp.MiddlewareHandlerResponse)
				// 无需 JWT 校验的路由
				group.Bind(
					check_jwt.NewV1(),
					login.NewV1(),
					file_controller.NewV1(),
					ai_chat.NewV1(),
				)

				// 需要 JWT 校验的路由
				group.Group("/", func(authGroup *ghttp.RouterGroup) {
					authGroup.Middleware(middleware.Auth)
					authGroup.Bind(
						rag.NewV1(),
						cron.NewV1(),
						files.NewV1(),
						voice.NewV1(),
						cron_execute.NewV1(),
					)
				})

			})

			s.Run()
			return nil
		},
	}
)
