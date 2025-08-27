package mcp

import (
	"context"
	"fmt"
	"github.com/mark3labs/mcp-go/mcp"
	"time"
)

// GetCurrentTimeHandler 获取当前时间处理器
func GetCurrentTimeHandler(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	timezone, err := request.RequireString("timezone")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("无效的时区: %s", timezone)), nil
	}
	currentTime := time.Now().In(loc)
	result := fmt.Sprintf("当前时间 (%s): %s", timezone, currentTime.Format("2006-01-02 15:04:05 MST"))
	return mcp.NewToolResultText(result), nil
}

// ConvertTimeHeader 时间转换处理器
func ConvertTimeHeader(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	sourceTimezone, err := request.RequireString("source_timezone")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	timeStr, err := request.RequireString("time")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	targetTimezone, err := request.RequireString("target_timezone")
	if err != nil {
		return mcp.NewToolResultError(err.Error()), nil
	}
	// 解析源时区
	sourceLoc, err := time.LoadLocation(sourceTimezone)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("无效的源时区: %s", sourceTimezone)), nil
	}
	//解析目标时区
	targetLoc, err := time.LoadLocation(targetTimezone)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("无效的目标时区: %s", targetTimezone)), nil
	}
	//解析时间
	today := time.Now().Format("2006-01-02")
	fullTimeStr := fmt.Sprintf("%s %s", today, timeStr)
	sourceTime, err := time.ParseInLocation("2006-01-02 15:04", fullTimeStr, sourceLoc)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("无效的时间格式: %s", timeStr)), nil
	}
	//转换到目标时间
	targetTime := sourceTime.In(targetLoc)
	result := fmt.Sprintf("%s (%s) = %s (%s)",
		sourceTime.Format("15:04"), sourceTimezone,
		targetTime.Format("15:04"), targetTimezone)

	return mcp.NewToolResultText(result), nil
}
