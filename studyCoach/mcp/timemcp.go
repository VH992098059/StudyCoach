package mcp

import (
	"context"
	"fmt"
	"time"
)

// GetCurrentTimeHandler 获取指定时区的当前时间
func GetCurrentTimeHandler(ctx context.Context, params map[string]interface{}) (interface{}, error) {
	// 获取时区参数，默认为上海时区
	timezone := "Asia/Shanghai"
	if tz, ok := params["timezone"].(string); ok && tz != "" {
		timezone = tz
	}

	// 加载时区
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		return nil, fmt.Errorf("invalid timezone: %s, error: %w", timezone, err)
	}

	// 获取当前时间
	now := time.Now().In(loc)

	// 返回格式化的时间信息
	result := map[string]interface{}{
		"timezone":     timezone,
		"current_time": now.Format("2006-01-02 15:04:05"),
		"iso_time":     now.Format(time.RFC3339),
		"unix_time":    now.Unix(),
		"weekday":      now.Weekday().String(),
		"year":         now.Year(),
		"month":        int(now.Month()),
		"day":          now.Day(),
		"hour":         now.Hour(),
		"minute":       now.Minute(),
		"second":       now.Second(),
	}

	return result, nil
}

// ConvertTimeHeader 时区时间转换
func ConvertTimeHeader(ctx context.Context, params map[string]interface{}) (interface{}, error) {
	// 获取参数
	sourceTimezone := "Asia/Shanghai"
	if tz, ok := params["source_timezone"].(string); ok && tz != "" {
		sourceTimezone = tz
	}

	targetTimezone := "Asia/Shanghai"
	if tz, ok := params["target_timezone"].(string); ok && tz != "" {
		targetTimezone = tz
	}

	timeStr, ok := params["time"].(string)
	if !ok || timeStr == "" {
		return nil, fmt.Errorf("time parameter is required")
	}

	// 加载源时区
	sourceLoc, err := time.LoadLocation(sourceTimezone)
	if err != nil {
		return nil, fmt.Errorf("invalid source timezone: %s, error: %w", sourceTimezone, err)
	}

	// 加载目标时区
	targetLoc, err := time.LoadLocation(targetTimezone)
	if err != nil {
		return nil, fmt.Errorf("invalid target timezone: %s, error: %w", targetTimezone, err)
	}

	// 解析时间（假设格式为 HH:MM）
	today := time.Now().In(sourceLoc)
	timeToConvert, err := time.ParseInLocation("15:04", timeStr, sourceLoc)
	if err != nil {
		return nil, fmt.Errorf("invalid time format, expected HH:MM: %w", err)
	}

	// 将解析的时间设置为今天的日期
	timeToConvert = time.Date(
		today.Year(), today.Month(), today.Day(),
		timeToConvert.Hour(), timeToConvert.Minute(), 0, 0,
		sourceLoc,
	)

	// 转换到目标时区
	convertedTime := timeToConvert.In(targetLoc)

	// 返回转换结果
	result := map[string]interface{}{
		"source_timezone": sourceTimezone,
		"target_timezone": targetTimezone,
		"source_time":     timeToConvert.Format("15:04"),
		"target_time":     convertedTime.Format("15:04"),
		"source_full":     timeToConvert.Format("2006-01-02 15:04:05 MST"),
		"target_full":     convertedTime.Format("2006-01-02 15:04:05 MST"),
		"time_difference": fmt.Sprintf("%+.1f hours", convertedTime.Sub(timeToConvert).Hours()),
	}

	return result, nil
}

// CreateTimeTools 创建时间相关的MCP工具
func CreateTimeTools() []*ToolAdapter {
	var tools []*ToolAdapter

	// 获取当前时间工具
	currentTimeTool := NewToolAdapter(
		"get_current_time",
		"Get current time in a specific timezone",
		GetCurrentTimeHandler,
	)

	// 时间转换工具
	convertTimeTool := NewToolAdapter(
		"convert_time",
		"Convert time between timezones",
		ConvertTimeHeader,
	)

	tools = append(tools, currentTimeTool, convertTimeTool)
	return tools
}
