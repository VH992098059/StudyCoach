package NormalChat

import (
	"context"
	"encoding/json"
	"log"
	"path/filepath"

	"github.com/cloudwego/eino-ext/adk/backend/local"
	"github.com/cloudwego/eino/adk/middlewares/skill"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

// skillTool 实现 Skill 工具，按需加载 SKILL.md 内容
type skillTool struct {
	backend skill.Backend
}

// Info 返回工具信息
func (t *skillTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	matters, err := t.backend.List(ctx)
	if err != nil {
		return nil, err
	}
	// 构建可用 skill 列表描述
	desc := `按需加载预定义技能。当用户任务匹配某个技能的描述时，调用此工具加载该技能的完整指令。
可用技能：`
	for _, m := range matters {
		desc += "\n- " + m.Name + ": " + m.Description
	}
	desc += `
调用方式：传入 skill 参数为技能名称，如 "frontend-beautifier"`
	return &schema.ToolInfo{
		Name: "skill",
		Desc: desc,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"skill": {
				Type:     schema.String,
				Desc:     "技能名称，如 frontend-beautifier",
				Required: true,
			},
		}),
	}, nil
}

// InvokableRun 执行技能加载
func (t *skillTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var args struct {
		Skill string `json:"skill"`
	}
	if err := json.Unmarshal([]byte(argumentsInJSON), &args); err != nil {
		return "", err
	}
	if args.Skill == "" {
		return "", nil
	}
	s, err := t.backend.Get(ctx, args.Skill)
	if err != nil {
		log.Printf("[NormalChat] skill Get failed: %v", err)
		return "", err
	}
	// 返回完整 SKILL.md 内容（frontmatter 后的正文 + 元数据）
	result := "Base directory: " + s.BaseDirectory + "\n\n"
	result += s.Content
	return result, nil
}

// newSkillTool 创建 Skill 工具
// 使用 eino v0.8+ 的 NewBackendFromFilesystem + eino-ext local filesystem backend
func newSkillTool(ctx context.Context) (tool.InvokableTool, error) {
	baseDir := "skills"
	if v, err := g.Cfg().Get(ctx, "skills.baseDir"); err == nil && v.String() != "" {
		baseDir = v.String()
	}
	// 相对 backend 工作目录，转为绝对路径（filesystem.Backend 要求绝对路径）
	absDir, err := filepath.Abs(baseDir)
	if err != nil {
		absDir = baseDir
	}

	// eino-ext local 实现 filesystem.Backend，用于读取本地 SKILL.md
	// 注意：local 的 Execute 使用 /bin/sh，仅 Unix/MacOS；Read/GlobInfo 在 Windows 上可用
	fsBackend, err := local.NewBackend(ctx, &local.Config{})
	if err != nil {
		log.Printf("[NormalChat] skill local.NewBackend failed: %v", err)
		return nil, err
	}

	// 确保 absDir 为 filesystem 期望的绝对路径格式（Windows 下如 K:\path 已满足）
	skillBackend, err := skill.NewBackendFromFilesystem(ctx, &skill.BackendFromFilesystemConfig{
		Backend: fsBackend,
		BaseDir: absDir,
	})
	if err != nil {
		log.Printf("[NormalChat] skill NewBackendFromFilesystem failed: %v", err)
		return nil, err
	}

	log.Printf("[NormalChat] 已加载 Skill 工具 (skill), baseDir=%s", absDir)
	return &skillTool{backend: skillBackend}, nil
}
