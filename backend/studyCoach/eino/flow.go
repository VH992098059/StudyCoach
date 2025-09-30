package eino

import (
	"backend/mcp/clock_time"
	"backend/studyCoach/configTool"
	"context"
	"log"
	"time"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
)

// newLambda4 component initialization function of node 'ReActLambda' in graph 'StudyCoachFor'
// 根据上下文中的isNetwork参数决定是否包含搜索工具
func newLambda4(ctx context.Context, conf *configTool.Config) (lba *compose.Lambda, err error) {
	clock_time.StartMCPServer()
	time.Sleep(2 * time.Second)
	// 从上下文中获取isNetwork参数
	isNetwork := false
	if val := ctx.Value("isNetwork"); val != nil {
		if networkFlag, ok := val.(bool); ok {
			isNetwork = networkFlag
		}
	}
	log.Printf("[ReActLambda] 配置工具 - 网络搜索: %v", isNetwork)

	// 初始化工具列表，首先添加MCP工具
	mcpTools := clock_time.GetMCPTool(ctx)
	tools := make([]tool.BaseTool, 0)
	tools = append(tools, mcpTools...)

	config := &react.AgentConfig{
		ToolsConfig: compose.ToolsNodeConfig{Tools: tools},
	}
	chatModelIns11, err := newChatModel2(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11

	// 只有当isNetwork为true时才添加搜索工具
	if isNetwork {
		toolIns21, err := NewTool(ctx)
		if err != nil {
			return nil, err
		}
		// 将搜索工具添加到现有工具列表中，而不是替换
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, toolIns21)
		log.Printf("[ReActLambda] 已添加duckduckgo_search工具和MCP工具")
	} else {
		log.Printf("[ReActLambda] 只添加了MCP工具（网络搜索已禁用）")
	}

	ins, err := react.NewAgent(ctx, config)
	if err != nil {
		return nil, err
	}
	lba, err = compose.AnyLambda(ins.Generate, ins.Stream, nil, nil)
	if err != nil {
		return nil, err
	}
	return lba, nil
}
