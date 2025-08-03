package eino

import (
	"context"
	"github.com/cloudwego/eino-ext/components/tool/duckduckgo"
	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"studyCoach/studyCoach/mcp"
	"time"
)

// newToolsNode component initialization function of node 'ResourceToolsNode' in graph 'studyCoachFor'
func newToolsNode(ctx context.Context) (tsn *compose.ToolsNode, err error) {
	// TODO Modify component configuration here.
	config := &compose.ToolsNodeConfig{}
	toolIns11, err := NewTool(ctx)
	if err != nil {
		return nil, err
	}
	config.Tools = []tool.BaseTool{toolIns11}
	tsn, err = compose.NewToolNode(ctx, config)
	if err != nil {
		return nil, err
	}
	return tsn, nil
}

func NewTool(ctx context.Context) (bt tool.InvokableTool, err error) {
	// TODO Modify component configuration here.
	config := &duckduckgo.Config{
		MaxResults: 5,
		Region:     ddgsearch.RegionWT,
		DDGConfig: &ddgsearch.Config{
			Timeout:    10 * time.Second,
			Cache:      true,
			MaxRetries: 4,
			Proxy:      "http://127.0.0.1:10808",
		},
	}
	bt, err = duckduckgo.NewTool(ctx, config)
	if err != nil {
		return nil, err
	}
	return bt, nil
}

func NewTool1(ctx context.Context) (bt tool.InvokableTool, err error) {
	// TODO Modify component configuration here.
	config := &duckduckgo.Config{
		ToolName:   "duckduckgo_search",
		MaxResults: 3,
		Region:     ddgsearch.RegionWT,
		DDGConfig: &ddgsearch.Config{
			Timeout:    10 * time.Second,
			Cache:      true,
			MaxRetries: 4,
			Proxy:      "http://127.0.0.1:10808",
		},
	}
	bt, err = duckduckgo.NewTool(ctx, config)
	if err != nil {
		return nil, err
	}
	return bt, nil
}

// 创建MCP时间工具
func NewMCPTimeTools(ctx context.Context) ([]tool.BaseTool, error) {
	var tools []tool.BaseTool

	// 获取当前时间工具
	currentTimeTool := &mcp.ToolAdapter{
		// 需要添加Info方法的实现
	}

	// 时间转换工具
	convertTimeTool := &mcp.ToolAdapter{
		// 需要添加Info方法的实现
	}

	tools = append(tools, currentTimeTool, convertTimeTool)
	return tools, nil
}
