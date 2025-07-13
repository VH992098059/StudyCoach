package main

import (
	_ "backend/internal/packed"

	_ "backend/internal/logic"

	"github.com/gogf/gf/v2/os/gctx"

	"backend/internal/cmd"
	_ "github.com/gogf/gf/contrib/drivers/mysql/v2"
	_ "github.com/gogf/gf/contrib/nosql/redis/v2"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
