package eino

import (
	"backend/studyCoach/configTool"
	"context"
	"log"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
)

// newLambda4 component initialization function of node 'ReActLambda' in graph 'StudyCoachFor'
// 根据上下文中的isNetwork参数决定是否包含搜索工具
func newLambda4(ctx context.Context, conf *configTool.Config) (lba *compose.Lambda, err error) {
	// 从上下文中获取isNetwork参数
	isNetwork := false
	if val := ctx.Value("isNetwork"); val != nil {
		if networkFlag, ok := val.(bool); ok {
			isNetwork = networkFlag
		}
	}

	log.Printf("[ReActLambda] 配置工具 - 网络搜索: %v", isNetwork)

	config := &react.AgentConfig{}
	chatModelIns11, err := newChatModel1(ctx, conf)
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
		config.ToolsConfig.Tools = []tool.BaseTool{toolIns21}
		log.Printf("[ReActLambda] 已添加duckduckgo_search工具")
	} else {
		// 不添加任何工具
		config.ToolsConfig.Tools = []tool.BaseTool{}
		log.Printf("[ReActLambda] 未添加搜索工具（网络搜索已禁用）")
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
