package CoachChat

import (
	"backend/studyCoach/aiModel/plantask"
	"backend/studyCoach/aiModel/skill"
	"backend/studyCoach/common"
	"context"
	"log"
	"time"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
)

// newLambda3 component initialization function of node 'ReActLambda' in graph 'StudyCoachFor'
func newLambda3(ctx context.Context, conf *common.Config) (lba *compose.Lambda, err error) {
	time.Sleep(2 * time.Second)
	// 从上下文中获取isNetwork参数
	isNetwork := false
	if val := ctx.Value("isNetwork"); val != nil {
		if networkFlag, ok := val.(bool); ok {
			isNetwork = networkFlag
		}
	}
	log.Printf("[ReActLambda] 配置工具 - 网络搜索: %v", isNetwork)

	config := &react.AgentConfig{}
	chatModelIns11, err := newChatModel2(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11

	// Skill 工具：按需加载 SKILL.md
	if skillTool, err := skill.NewTool(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, skillTool)
		log.Printf("[ReActLambda] 已添加 Skill 工具")
	} else {
		log.Printf("[ReActLambda] Skill 工具加载失败(跳过): %v", err)
	}
	// PlanTask 工具：TaskCreate/TaskGet/TaskUpdate/TaskList
	if planTaskTools, err := plantask.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, planTaskTools...)
		log.Printf("[ReActLambda] 已添加 PlanTask 工具")
	} else {
		log.Printf("[ReActLambda] PlanTask 工具加载失败(跳过): %v", err)
	}

	if isNetwork {
		toolIns21, err := NewTool(ctx)
		if err != nil {
			return nil, err
		}
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, toolIns21)
		log.Printf("[ReActLambda] 已添加duckduckgo_search工具")
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

// newLambda4 component initialization function of node 'ToStudyChatModel' in graph 'StudyCoachFor'
func newLambda4(ctx context.Context, conf *common.Config) (lba *compose.Lambda, err error) {
	config := &react.AgentConfig{}
	chatModelIns11, err := newChatModel3(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11

	// web_search 工具
	toolIns21, err := newTool1(ctx)
	if err != nil {
		return nil, err
	}
	config.ToolsConfig.Tools = []tool.BaseTool{toolIns21}

	// Skill 工具
	if skillTool, err := skill.NewTool(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, skillTool)
		log.Printf("[ToStudyChatModel] 已添加 Skill 工具")
	} else {
		log.Printf("[ToStudyChatModel] Skill 工具加载失败(跳过): %v", err)
	}
	// PlanTask 工具
	if planTaskTools, err := plantask.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, planTaskTools...)
		log.Printf("[ToStudyChatModel] 已添加 PlanTask 工具")
	} else {
		log.Printf("[ToStudyChatModel] PlanTask 工具加载失败(跳过): %v", err)
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
