package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/goccy/go-json"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// WorldTimeResponse 网络时间API响应结构
type WorldTimeResponse struct {
	DateTime  string `json:"datetime"`
	Timezone  string `json:"timezone"`
	UtcOffset string `json:"utc_offset"`
}

func getNetworkTimeFromAPI(ctx context.Context, timezone string) (*time.Time, error) {
	// 使用更短的超时时间，避免长时间等待
	client := &http.Client{Timeout: 5 * time.Second}

	// 尝试多个时间API服务
	urls := []string{
		fmt.Sprintf("https://worldtimeapi.org/api/timezone/%s", timezone),
		fmt.Sprintf("http://worldtimeapi.org/api/timezone/%s", timezone), // HTTP备用
	}

	var lastErr error
	for _, url := range urls {
		// 创建带上下文的请求
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			lastErr = fmt.Errorf("创建请求失败: %w", err)
			continue
		}

		resp, err := client.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("网络请求失败: %w", err)
			continue
		}

		// 检查HTTP状态码
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("API返回错误状态码: %d", resp.StatusCode)
			continue
		}

		var timeResp WorldTimeResponse
		if err := json.NewDecoder(resp.Body).Decode(&timeResp); err != nil {
			resp.Body.Close()
			lastErr = fmt.Errorf("解析响应失败: %w", err)
			continue
		}
		resp.Body.Close()

		// 尝试多种时间格式解析
		timeFormats := []string{
			time.RFC3339,
			time.DateTime,
			"2006-01-02T15:04:05.000000-07:00",
			"2006-01-02T15:04:05-07:00",
		}

		for _, format := range timeFormats {
			if parsedTime, err := time.Parse(format, timeResp.DateTime); err == nil {
				return &parsedTime, nil
			}
		}

		lastErr = fmt.Errorf("无法解析时间格式: %s", timeResp.DateTime)
	}

	return nil, lastErr
}

// 获取本地系统时间
func getLocalTime(ctx context.Context) *time.Time {
	now := time.Now()
	return &now
}

func handleGetNetworkTime(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	// 获取时区参数，如果未提供则使用默认值 UTC
	timezone := request.GetString("timezone", "UTC")

	// 验证时区参数不为空
	if timezone == "" {
		timezone = "UTC"
	}

	networkTime, err := getNetworkTimeFromAPI(ctx, timezone)
	if err != nil {
		// 如果网络时间获取失败，使用本地时间作为备用方案
		localTime := getLocalTime(ctx)

		// 尝试根据时区调整本地时间
		loc, locErr := time.LoadLocation(timezone)
		if locErr == nil {
			adjustedTime := localTime.In(loc)
			result := fmt.Sprintf("⚠️ 网络时间获取失败，使用本地时间转换 (%s): %s\n错误信息: %v", timezone, adjustedTime.Format("2006-01-02 15:04:05 MST"), err)
			return mcp.NewToolResultText(result), nil
		}

		// 如果时区转换也失败，直接返回本地时间
		result := fmt.Sprintf("⚠️ 网络时间和时区转换都失败，返回本地时间: %s\n错误信息: %v", localTime.Format("2006-01-02 15:04:05 MST"), err)
		return mcp.NewToolResultText(result), nil
	}

	// 格式化返回结果
	result := fmt.Sprintf("🌍 网络时间 (%s): %s", timezone, networkTime.Format("2006-01-02 15:04:05 MST"))
	return mcp.NewToolResultText(result), nil
}

// MCP工具：获取本地时间
func handleGetLocalTime(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	localTime := getLocalTime(ctx)

	// 格式化本地时间结果
	result := fmt.Sprintf("🏠 本地时间: %s", localTime.Format("2006-01-02 15:04:05 MST"))
	return mcp.NewToolResultText(result), nil
}

// 创建MCP服务器
func CreateMCPServer() *server.MCPServer {
	// 创建服务器，添加推荐的选项
	s := server.NewMCPServer(
		"time-service",
		"1.0.0",
		server.WithToolCapabilities(true), // 启用工具功能
		server.WithRecovery(),             // 启用错误恢复
	)

	// 注册获取网络时间工具
	networkTimeTool := mcp.NewTool("get_network_time",
		mcp.WithDescription("获取指定时区的网络时间，支持世界各地时区"),
		mcp.WithString("timezone",
			mcp.Description("时区名称，如 UTC, Asia/Shanghai, America/New_York, Europe/London 等。默认为 UTC"),
		),
	)
	s.AddTool(networkTimeTool, handleGetNetworkTime)

	// 注册获取本地时间工具
	localTimeTool := mcp.NewTool("get_local_time",
		mcp.WithDescription("获取服务器系统的本地时间"),
	)
	s.AddTool(localTimeTool, handleGetLocalTime)

	return s
}

// StartMCPServer 启动MCP服务器
func StartMCPServer() error {
	s := CreateMCPServer()

	fmt.Println("启动时间服务MCP服务器...")
	fmt.Println("使用 stdio 传输方式")

	// 使用 stdio 传输方式启动服务器
	return server.ServeStdio(s)
}

// main 函数，用于独立运行服务器
func main() {
	fmt.Println("=== 时间服务 MCP 服务器 ===")
	fmt.Println("提供网络时间和本地时间查询服务")

	if err := StartMCPServer(); err != nil {
		fmt.Printf("服务器启动失败: %v\n", err)
	}
}
