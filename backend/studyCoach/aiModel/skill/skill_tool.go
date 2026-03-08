// Package skill 提供 Skill 工具的公共实现，供 NormalChat、CoachChat 等复用。
package skill

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

// Tool 实现 Skill 工具，按需加载 SKILL.md 内容
type Tool struct {
	backend skill.Backend
}

// Info 返回工具信息
func (t *Tool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	matters, err := t.backend.List(ctx)
	if err != nil {
		return nil, err
	}
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
func (t *Tool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
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
		log.Printf("[Skill] Get failed: %v", err)
		return "", err
	}
	result := "Base directory: " + s.BaseDirectory + "\n\n"
	result += s.Content
	return result, nil
}

// NewTool 创建 Skill 工具，供 NormalChat、CoachChat 等复用
func NewTool(ctx context.Context) (tool.InvokableTool, error) {
	baseDir := "skills"
	if v, err := g.Cfg().Get(ctx, "skills.baseDir"); err == nil && v.String() != "" {
		baseDir = v.String()
	}
	absDir, err := filepath.Abs(baseDir)
	if err != nil {
		absDir = baseDir
	}

	fsBackend, err := local.NewBackend(ctx, &local.Config{})
	if err != nil {
		log.Printf("[Skill] local.NewBackend failed: %v", err)
		return nil, err
	}

	skillBackend, err := skill.NewBackendFromFilesystem(ctx, &skill.BackendFromFilesystemConfig{
		Backend: fsBackend,
		BaseDir: absDir,
	})
	if err != nil {
		log.Printf("[Skill] NewBackendFromFilesystem failed: %v", err)
		return nil, err
	}

	log.Printf("[Skill] 已加载 Skill 工具, baseDir=%s", absDir)
	return &Tool{backend: skillBackend}, nil
}
