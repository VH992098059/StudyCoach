package CoachChat

import (
	"backend/studyCoach/aiModel/eino_tools/filesystem"
	"backend/studyCoach/aiModel/eino_tools/knowledge"
	"backend/studyCoach/aiModel/eino_tools/plantask"
	"backend/studyCoach/aiModel/eino_tools/skill"
	"backend/studyCoach/aiModel/eino_tools/studyplan"
	"backend/studyCoach/common"
	"context"
	"github.com/gogf/gf/v2/frame/g"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
)

// newLambda3 component initialization function of node 'ReActLambda' in graph 'StudyCoachFor'
func buildReActAgent(ctx context.Context, conf *common.Config) (lba *compose.Lambda, err error) {
	// 从上下文中获取isNetwork参数
	isNetwork := false
	if val := ctx.Value("isNetwork"); val != nil {
		if networkFlag, ok := val.(bool); ok {
			isNetwork = networkFlag
		}
	}
	g.Log().Infof(ctx, "[ReActLambda] 配置工具 - 网络搜索: %v", isNetwork)

	config := &react.AgentConfig{
		MaxStep:               100,
		StreamToolCallChecker: common.DrainStreamChecker,
	}
	chatModelIns11, err := buildReActModel(ctx, conf)
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
	// Skill 工具：按需加载 SKILL.md
	if skillTool, err := skill.NewTool(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, skillTool)
		g.Log().Infof(ctx, "[ReActLambda] 已添加 Skill 工具")
	} else {
		g.Log().Infof(ctx, "[ReActLambda] Skill 工具加载失败(跳过): %v", err)
	}
	// PlanTask 工具：TaskCreate/TaskGet/TaskUpdate/TaskList
	if planTaskTools, err := plantask.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, planTaskTools...)
		g.Log().Infof(ctx, "[ReActLambda] 已添加 PlanTask 工具")
	} else {
		g.Log().Infof(ctx, "[ReActLambda] PlanTask 工具加载失败(跳过): %v", err)
	}
	// 学习计划持久化：save_plan/read_plan
	if studyPlanTools, err := studyplan.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, studyPlanTools...)
		g.Log().Infof(ctx, "[ReActLambda] 已添加 StudyPlan 工具 (save_plan/read_plan)")
	} else {
		g.Log().Infof(ctx, "[ReActLambda] StudyPlan 工具加载失败(跳过): %v", err)
	}
	// 文件系统：read_file、write_file、execute（处理 CSV、执行代码等）
	if fsTools, err := filesystem.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, fsTools...)
		g.Log().Infof(ctx, "[ReActLambda] 已添加 Filesystem 工具 (read_file/write_file/execute)")
	} else {
		g.Log().Infof(ctx, "[ReActLambda] Filesystem 工具加载失败(跳过): %v", err)
	}
	// 知识库搜索工具：search_knowledge，支持按 update_type 过滤增量/全量内容
	if kbTool, err := knowledge.NewTool(); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, kbTool)
		g.Log().Infof(ctx, "[ReActLambda] 已添加 Knowledge 搜索工具 (search_knowledge)")
	} else {
		g.Log().Infof(ctx, "[ReActLambda] Knowledge 工具加载失败(跳过): %v", err)
	}

	if isNetwork {
		toolIns21, err := NewTool(ctx)
		if err != nil {
			return nil, err
		}
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, toolIns21)
		g.Log().Infof(ctx, "[ReActLambda] 已添加duckduckgo_search工具")
	} else {
		g.Log().Infof(ctx, "[ReActLambda] 网络搜索未启用")
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

// newLambda4 PlanModifyModel：修改、增加、删除现有计划，含 filesystem 支持
func buildPlanModifyModel(ctx context.Context, conf *common.Config) (lba *compose.Lambda, err error) {
	config := &react.AgentConfig{
		MaxStep:               100,
		StreamToolCallChecker: common.DrainStreamChecker,
	}
	chatModelIns11, err := buildToStudyModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.ToolCallingModel = chatModelIns11

	// 注入工具调用通知中间件
	config.ToolsConfig.ToolCallMiddlewares = append(
		config.ToolsConfig.ToolCallMiddlewares,
		common.BuildNotifyMiddleware(),
	)

	// web_search 工具
	toolIns21, err := newTool1(ctx)
	if err != nil {
		return nil, err
	}
	config.ToolsConfig.Tools = []tool.BaseTool{toolIns21}

	// Skill 工具
	if skillTool, err := skill.NewTool(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, skillTool)
		g.Log().Infof(ctx, "[PlanModifyModel] 已添加 Skill 工具")
	} else {
		g.Log().Infof(ctx, "[PlanModifyModel] Skill 工具加载失败(跳过): %v", err)
	}
	// PlanTask 工具
	if planTaskTools, err := plantask.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, planTaskTools...)
		g.Log().Infof(ctx, "[PlanModifyModel] 已添加 PlanTask 工具")
	} else {
		g.Log().Infof(ctx, "[PlanModifyModel] PlanTask 工具加载失败(跳过): %v", err)
	}
	// 学习计划持久化
	if studyPlanTools, err := studyplan.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, studyPlanTools...)
		g.Log().Infof(ctx, "[PlanModifyModel] 已添加 StudyPlan 工具")
	} else {
		g.Log().Infof(ctx, "[PlanModifyModel] StudyPlan 工具加载失败(跳过): %v", err)
	}
	// 文件系统：修改计划时可能需要读写文件
	if fsTools, err := filesystem.NewTools(ctx); err == nil {
		config.ToolsConfig.Tools = append(config.ToolsConfig.Tools, fsTools...)
		g.Log().Infof(ctx, "[PlanModifyModel] 已添加 Filesystem 工具 (read_file/write_file/execute)")
	} else {
		g.Log().Infof(ctx, "[PlanModifyModel] Filesystem 工具加载失败(跳过): %v", err)
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
