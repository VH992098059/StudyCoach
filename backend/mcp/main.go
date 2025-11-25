package main

import (
	"backend/mcp/clock_time"
)

func main() {
	clock_time.StartMCPServer()
	/*time.Sleep(1 * time.Second)
	ctx := context.Background()

	mcpTools := clock_time.GetMCPTool(ctx)

	for _, mcpTool := range mcpTools {
		info, err := mcpTool.Info(ctx)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println("Name:", info.Name)
		fmt.Println("Desc:", info.Desc)
		// 测试不同的时间格式
		formatTime := `{"format":"readable", "timezone":"Asia/Shanghai"}`

		mcpTool.(tool.InvokableTool).InvokableRun(ctx, formatTime)
		fmt.Println()
	}*/
}
