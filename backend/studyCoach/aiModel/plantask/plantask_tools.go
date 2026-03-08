// Package plantask 提供 PlanTask 工具的公共实现（TaskCreate/TaskGet/TaskUpdate/TaskList），供 CoachChat、NormalChat 等复用。
package plantask

import (
	"context"
	"log"
	"os"
	"path/filepath"

	"github.com/cloudwego/eino/adk"
	einoPlantask "github.com/cloudwego/eino/adk/middlewares/plantask"
	"github.com/cloudwego/eino/components/tool"
	"github.com/gogf/gf/v2/frame/g"
)

// localBackend 实现 einoPlantask.Backend，基于本地文件系统
type localBackend struct {
	baseDir string
}

func (b *localBackend) LsInfo(ctx context.Context, req *einoPlantask.LsInfoRequest) ([]einoPlantask.FileInfo, error) {
	path := filepath.Clean(req.Path)
	if path == "" {
		path = b.baseDir
	}
	entries, err := os.ReadDir(path)
	if err != nil {
		if os.IsNotExist(err) {
			return []einoPlantask.FileInfo{}, nil
		}
		return nil, err
	}
	var result []einoPlantask.FileInfo
	for _, e := range entries {
		fullPath := filepath.Join(path, e.Name())
		result = append(result, einoPlantask.FileInfo{Path: fullPath})
	}
	return result, nil
}

func (b *localBackend) Read(ctx context.Context, req *einoPlantask.ReadRequest) (string, error) {
	data, err := os.ReadFile(req.FilePath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (b *localBackend) Write(ctx context.Context, req *einoPlantask.WriteRequest) error {
	dir := filepath.Dir(req.FilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(req.FilePath, []byte(req.Content), 0644)
}

func (b *localBackend) Delete(ctx context.Context, req *einoPlantask.DeleteRequest) error {
	return os.Remove(req.FilePath)
}

// NewTools 创建 PlanTask 四个工具（TaskCreate/TaskGet/TaskUpdate/TaskList），供 ReAct Agent 使用
func NewTools(ctx context.Context) ([]tool.BaseTool, error) {
	baseDir := "plantask_tasks"
	if v, err := g.Cfg().Get(ctx, "plantask.baseDir"); err == nil && v.String() != "" {
		baseDir = v.String()
	}
	absDir, err := filepath.Abs(baseDir)
	if err != nil {
		absDir = baseDir
	}
	if err := os.MkdirAll(absDir, 0755); err != nil {
		log.Printf("[PlanTask] MkdirAll failed: %v", err)
		return nil, err
	}

	backend := &localBackend{baseDir: absDir}
	mw, err := einoPlantask.New(ctx, &einoPlantask.Config{
		Backend: backend,
		BaseDir: absDir,
	})
	if err != nil {
		log.Printf("[PlanTask] New failed: %v", err)
		return nil, err
	}

	runCtx := &adk.ChatModelAgentContext{
		Tools: []tool.BaseTool{},
	}
	_, newCtx, err := mw.BeforeAgent(ctx, runCtx)
	if err != nil {
		return nil, err
	}

	log.Printf("[PlanTask] 已加载 TaskCreate/TaskGet/TaskUpdate/TaskList, baseDir=%s", absDir)
	return newCtx.Tools, nil
}
