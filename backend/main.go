package main

import (
	"backend/internal/cmd"
	_ "backend/internal/logic"
	_ "backend/internal/packed"
	"backend/studyCoach/seaweedFS/FilerMode"
	"backend/utility/dotenv"

	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	_ "github.com/gogf/gf/contrib/nosql/redis/v2"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gcfg"
	"github.com/gogf/gf/v2/os/gctx"
)

// seaweedFS初始化
func init() {
	FilerMode.NewFilerClient("http://localhost:8888")
}

func main() {
	// 根据 .env 渲染 manifest/config/config.template.yaml，生成 config.yaml；
	// .env 不存在时跳过，不影响直接手写 config.yaml 的部署方式。
	res, err := dotenv.Generate(
		"manifest/config/config.template.yaml",
		"manifest/config/config.yaml",
		".env", "../.env",
	)
	ctx := gctx.GetInitCtx()
	if err != nil {
		g.Log().Warningf(ctx, ".env 配置生成失败: %v", err)
	} else if res.Generated {
		// 清空 gcfg 缓存，确保后续读取到的是刚生成的配置
		if adapter, ok := g.Cfg().GetAdapter().(*gcfg.AdapterFile); ok {
			adapter.Clear()
		}
		g.Log().Infof(ctx, "已根据 %s 生成配置 %s", res.EnvFile, res.OutputPath)
		if len(res.Missing) > 0 {
			g.Log().Warningf(ctx, ".env 中未提供且无默认值的变量（对应配置将为空）: %v", res.Missing)
		}
	}

	/*// 加载环境变量
	if err := godotenv.Load("../.env"); err != nil {
		// 如果上级目录没有，尝试加载当前目录的 .env
		if err := godotenv.Load(); err != nil {
			g.Log().Infof(ctx, "Warning: error loading .env file: %v", err)
		}
	}
	ctx := context.Background()
	client, err := cozeloop.NewClient()
	if err != nil {
		panic(err)
	}
	defer client.Close(ctx)
	// 在服务 init 时 once 调用
	handler := ccb.NewLoopHandler(client)
	callbacks.AppendGlobalHandlers(handler)*/
	cmd.Main.Run(gctx.GetInitCtx())
}
