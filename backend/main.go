package main

import (
	"backend/internal/cmd"
	_ "backend/internal/logic"
	_ "backend/internal/packed"
	"backend/studyCoach/seaweedFS/FilerMode"

	"github.com/gogf/gf/v2/os/gctx"

	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	_ "github.com/gogf/gf/contrib/nosql/redis/v2"
)

// seaweedFS初始化
func init() {
	FilerMode.NewFilerClient("http://localhost:8888")
}

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
