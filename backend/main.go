package main

import (
	"backend/internal/cmd"
	_ "backend/internal/logic"
	_ "backend/internal/packed"
	"backend/studyCoach/seaweedFS/FilerMode"
	"context"
	"log"

	ccb "github.com/cloudwego/eino-ext/callbacks/cozeloop"
	"github.com/cloudwego/eino/callbacks"
	"github.com/coze-dev/cozeloop-go"
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	_ "github.com/gogf/gf/contrib/nosql/redis/v2"
	"github.com/gogf/gf/v2/os/gctx"
	"github.com/joho/godotenv"
)

// seaweedFS初始化
func init() {
	FilerMode.NewFilerClient("http://localhost:8888")
}

func main() {
	// 加载环境变量
	if err := godotenv.Load("../.env"); err != nil {
		// 如果上级目录没有，尝试加载当前目录的 .env
		if err := godotenv.Load(); err != nil {
			log.Printf("Warning: error loading .env file: %v", err)
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
	callbacks.AppendGlobalHandlers(handler)
	cmd.Main.Run(gctx.GetInitCtx())
}
