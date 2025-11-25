package regular_update

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
)

// newLambda component initialization function of node 'Lambda2' in graph 'RegularUpdate'
func newLambda(ctx context.Context, conf *common.Config) (lba *compose.Lambda, err error) {
	// TODO Modify component configuration here.
	config := &react.AgentConfig{}
	chatModelIns11, err := newChatModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11
	toolIns21, err := newTool(ctx)
	if err != nil {
		return nil, err
	}
	config.ToolsConfig.Tools = []tool.BaseTool{toolIns21}
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
