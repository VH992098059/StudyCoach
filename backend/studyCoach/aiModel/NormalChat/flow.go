package NormalChat

import (
	"backend/studyCoach/aiModel/eino_tools/filesystem"
	"backend/studyCoach/aiModel/eino_tools/skill"
	"backend/studyCoach/common"
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
	log.Printf("[ReActLambda] 配置工具 - 网络搜索(联网): %v", isNetwork)
	config := &react.AgentConfig{
		MaxStep:               100,
		StreamToolCallChecker: common.DrainStreamChecker,
	}
	chatModelIns11, err := newChatModel(ctx)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11

	// 注入工具调用通知中间件，实现 Generate 模式下的实时 tool_status 推送
	config.ToolsConfig.ToolCallMiddlewares = append(
		config.ToolsConfig.ToolCallMiddlewares,
		common.BuildNotifyMiddleware(),
	)
	// 系统时间已通过提示词注入 current_time，无需 get_system_time 工具
	// 始终添加 Skill 工具（按需加载 SKILL.md），NormalChat 排除 plantask-usage、studyplan-usage（任务/计划管理仅在教练模式）
	if skillTool, err := skill.NewToolWithExclude(ctx, []string{"plantask-usage", "studyplan-usage", "de-ai-style"}); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, skillTool)
		log.Printf("[ReActLambda] 已添加 Skill 工具（已排除 plantask/studyplan）")
	} else {
		log.Printf("[ReActLambda] Skill 工具加载失败(跳过): %v", err)
	}
	// 文件系统：read_file、write_file、execute（配合 filesystem-usage Skill）
	if fsTools, err := filesystem.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, fsTools...)
		log.Printf("[ReActLambda] 已添加 Filesystem 工具 (read_file/write_file/execute)")
	} else {
		log.Printf("[ReActLambda] Filesystem 工具加载失败(跳过): %v", err)
	}
	if isNetwork {
		toolIns21, err := newTool(ctx)
		if err != nil {
			return nil, err
		}
		// 将搜索工具添加到现有工具列表中
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, toolIns21)
		log.Printf("[ReActLambda] 已添加 web_search 工具")
	} else {
		log.Printf("[ReActLambda] 网络搜索未启用")
	}
	ins, err := react.NewAgent(ctx, config)
	if err != nil {
		return nil, err
	}
	lba, err = compose.AnyLambda(ins.Generate, common.BuildGenToStream(ins), nil, nil)
	if err != nil {
		return nil, err
	}
	return lba, nil
}
