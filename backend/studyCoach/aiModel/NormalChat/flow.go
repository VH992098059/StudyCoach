package NormalChat

import (
	"context"
	"log"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
)

// newLambda component initialization function of node 'NormalModel' in graph 'NormalChat'
func newLambda(ctx context.Context) (lba *compose.Lambda, err error) {
	isNetwork := false
	if val := ctx.Value("isNetwork"); val != nil {
		if networkFlag, ok := val.(bool); ok {
			isNetwork = networkFlag
		}
	}
	log.Printf("[ReActLambda] 配置工具 - 网络搜索: %v", isNetwork)
	config := &react.AgentConfig{}
	chatModelIns11, err := newChatModel(ctx)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11
	if isNetwork {
		toolIns21, err := newTool(ctx)
		if err != nil {
			return nil, err
		}
		// 将搜索工具添加到现有工具列表中
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, toolIns21)
		log.Printf("[ReActLambda] 已添加工具")
	} else {
		log.Printf("[ReActLambda] 网络搜索未启用")
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
