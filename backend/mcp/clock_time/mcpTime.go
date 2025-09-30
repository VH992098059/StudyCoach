package clock_time

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cloudwego/eino/components/tool"
	"github.com/mark3labs/mcp-go/client"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	mcpp "github.com/cloudwego/eino-ext/components/tool/mcp"
)

func main() {
	StartMCPServer()
	time.Sleep(1 * time.Second)
	ctx := context.Background()

	mcpTools := GetMCPTool(ctx)

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
	}
}

func GetMCPTool(ctx context.Context) []tool.BaseTool {
	cli, err := client.NewSSEMCPClient("http://localhost:12345/sse")
	if err != nil {
		log.Fatal(err)
	}
	err = cli.Start(ctx)
	if err != nil {
		log.Fatal(err)
	}

	initRequest := mcp.InitializeRequest{}
	initRequest.Params.ProtocolVersion = mcp.LATEST_PROTOCOL_VERSION
	initRequest.Params.ClientInfo = mcp.Implementation{
		Name:    "example-client",
		Version: "1.0.0",
	}

	_, err = cli.Initialize(ctx, initRequest)
	if err != nil {
		log.Fatal(err)
	}

	tools, err := mcpp.GetTools(ctx, &mcpp.Config{Cli: cli})
	if err != nil {
		log.Fatal(err)
	}
	log.Println(tools)
	return tools
}

func StartMCPServer() {
	svr := server.NewMCPServer("demo", mcp.LATEST_PROTOCOL_VERSION)
	svr.AddTool(mcp.NewTool("get_current_time",
		mcp.WithDescription("get current time"),
		mcp.WithString("format",
			mcp.Required(),
			mcp.Description("time format readable"),
			mcp.Enum("readable"),
		),
		mcp.WithString("timezone",
			mcp.Description("Timezone (default: Local, e.g., UTC, Asia/Shanghai)"),
		),
	), func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		arg := request.Params.Arguments.(map[string]any)
		// 获取时区
		var loc *time.Location
		var err error
		if timezone, ok := arg["timezone"].(string); ok && timezone != "" {
			loc, err = time.LoadLocation(timezone)
			if err != nil {
				return mcp.NewToolResultText(fmt.Sprintf("Invalid timezone: %s", timezone)), nil
			}
		} else {
			loc = time.Local
		}
		now := time.Now().In(loc)
		result := now.Format("2006-01-02 15:04:05 Monday")
		log.Println(result, loc.String())
		return mcp.NewToolResultText(result), nil
	})
	go func() {
		defer func() {
			e := recover()
			if e != nil {
				fmt.Println(e)
			}
		}()
		err := server.NewSSEServer(svr, server.WithBaseURL("http://localhost:12345")).Start("localhost:12345")
		if err != nil {
			log.Fatal(err)
		}
	}()
}
