// Package plantask 提供 PlanTask 工具的公共实现（TaskCreate/TaskGet/TaskUpdate/TaskList），供 CoachChat、NormalChat 等复用。
// 优先存储到 SeaweedFS；若未启动则退回到本地，SeaweedFS 启动后再同步上传，并做重复上传判断。
//
// 多租户隔离（A 方案）：eino plantask 中间件用固定的 BaseDir 生成 task 文件路径（含 .highwatermark 全局自增计数），
// 而工具在每次请求执行时（Backend 的 Read/Write/Delete/LsInfo）都能拿到带用户身份的 ctx。
// 因此本 Backend 在每个方法入口用 utility.WorkspacePrefix(ctx) 把路径重映射到 {baseDir}/{users.uuid}/... 子目录，
// 本地与 SeaweedFS 一致，无需改图构建（图仍跨用户共享）。
package plantask

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/cloudwego/eino/adk"
	einoFilesystem "github.com/cloudwego/eino/adk/filesystem"
	einoPlantask "github.com/cloudwego/eino/adk/middlewares/plantask"
	"github.com/cloudwego/eino/components/tool"
	"github.com/gogf/gf/v2/frame/g"

	"backend/studyCoach/seaweedFS/FilerMode"
	"backend/utility"
)

// plantaskRemoteBase SeaweedFS 上的逻辑路径前缀（与本地目录名 plantask 可不同）
const plantaskRemoteBase = "plantask_tasks"
const pendingFileName = "_pending_upload.json"

// pendingEntry 待同步记录
type pendingEntry struct {
	RemotePath string `json:"remote_path"`
	LocalPath  string `json:"local_path"`
}

// hybridBackend 混合存储：SeaweedFS 优先，本地回退，支持启动后同步与去重；按用户（users.uuid）隔离。
type hybridBackend struct {
	baseDir string
	client  *FilerMode.FilerClient
	mu      sync.Mutex
}

// userScope 返回当前用户的 baseDir 子目录（无用户时返回全局 baseDir，兼容非 HTTP 调用）。
func (b *hybridBackend) userScope(ctx context.Context) string {
	prefix := utility.WorkspacePrefix(ctx)
	if prefix == "" {
		return b.baseDir
	}
	return filepath.Join(b.baseDir, prefix)
}

// scopeLocal 把 eino 中间件传来的、位于 baseDir 下的路径，重映射到当前用户子目录。
// 若无法解析相对路径（路径不在 baseDir 下）或无用户前缀，原样返回。
func (b *hybridBackend) scopeLocal(ctx context.Context, path string) string {
	prefix := utility.WorkspacePrefix(ctx)
	if prefix == "" {
		return path
	}
	rel, err := filepath.Rel(b.baseDir, path)
	if err != nil || rel == ".." || strings.HasPrefix(rel, "..") {
		return path
	}
	if rel == "." {
		return filepath.Join(b.baseDir, prefix)
	}
	return filepath.Join(b.baseDir, prefix, rel)
}

// toRemotePath 计算 SeaweedFS 逻辑路径（先按用户 scope，再映射到 plantask_tasks 前缀）。
func (b *hybridBackend) toRemotePath(ctx context.Context, localPath string) string {
	scoped := b.scopeLocal(ctx, localPath)
	rel, err := filepath.Rel(b.baseDir, scoped)
	if err != nil {
		return strings.ReplaceAll(scoped, "\\", "/")
	}
	return filepath.Join(plantaskRemoteBase, filepath.ToSlash(rel))
}

// pendingPath 返回当前用户的待同步记录文件路径。
func (b *hybridBackend) pendingPath(ctx context.Context) string {
	return filepath.Join(b.userScope(ctx), pendingFileName)
}

func (b *hybridBackend) loadPending(ctx context.Context) ([]pendingEntry, error) {
	p := b.pendingPath(ctx)
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var list []pendingEntry
	if err := json.Unmarshal(data, &list); err != nil {
		return nil, err
	}
	return list, nil
}

func (b *hybridBackend) savePending(ctx context.Context, list []pendingEntry) error {
	p := b.pendingPath(ctx)
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0644)
}

func (b *hybridBackend) addPending(ctx context.Context, remotePath, localPath string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	list, err := b.loadPending(ctx)
	if err != nil {
		return err
	}
	for _, e := range list {
		if e.RemotePath == remotePath {
			return nil
		}
	}
	list = append(list, pendingEntry{RemotePath: remotePath, LocalPath: localPath})
	return b.savePending(ctx, list)
}

func (b *hybridBackend) removePending(ctx context.Context, remotePath string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	list, err := b.loadPending(ctx)
	if err != nil {
		return err
	}
	var newList []pendingEntry
	for _, e := range list {
		if e.RemotePath != remotePath {
			newList = append(newList, e)
		}
	}
	return b.savePending(ctx, newList)
}

func (b *hybridBackend) syncPendingToSeaweedFS(ctx context.Context) {
	if b.client == nil {
		return
	}
	b.mu.Lock()
	list, err := b.loadPending(ctx)
	b.mu.Unlock()
	if err != nil || len(list) == 0 {
		return
	}
	for _, e := range list {
		exists, err := b.client.SeaweedFSExists(ctx, e.RemotePath)
		if err != nil || exists {
			if exists {
				_ = b.removePending(ctx, e.RemotePath)
			}
			continue
		}
		data, err := os.ReadFile(e.LocalPath)
		if err != nil {
			g.Log().Infof(ctx, "[plantask] 同步时读取本地失败 %s: %v", e.LocalPath, err)
			continue
		}
		reader := bytes.NewReader(data)
		if err := b.client.SeaweedFSUpload(ctx, e.RemotePath, reader); err != nil {
			g.Log().Infof(ctx, "[plantask] 同步上传失败 %s: %v", e.RemotePath, err)
			continue
		}
		_ = b.removePending(ctx, e.RemotePath)
		g.Log().Infof(ctx, "[plantask] 已同步到 SeaweedFS: %s", e.RemotePath)
	}
}

func (b *hybridBackend) LsInfo(ctx context.Context, req *einoPlantask.LsInfoRequest) ([]einoPlantask.FileInfo, error) {
	path := filepath.Clean(b.scopeLocal(ctx, req.Path))
	if path == "" {
		path = b.userScope(ctx)
	}
	// 每次列出时尝试同步
	b.syncPendingToSeaweedFS(ctx)

	// 优先尝试 SeaweedFS
	if b.client != nil {
		rel, err := filepath.Rel(b.baseDir, path)
		if err != nil || rel == ".." || strings.HasPrefix(rel, "..") {
			rel = ""
		}
		remotePath := plantaskRemoteBase
		if rel != "" && rel != "." {
			remotePath = filepath.Join(plantaskRemoteBase, filepath.ToSlash(rel))
		}
		remotePath = filepath.ToSlash(remotePath)
		names, err := b.client.SeaweedFSList(ctx, remotePath)
		if err == nil {
			var result []einoPlantask.FileInfo
			for _, n := range names {
				fullPath := filepath.Join(path, n)
				result = append(result, einoPlantask.FileInfo{Path: fullPath})
			}
			return result, nil
		}
	}

	// 回退本地
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

func (b *hybridBackend) Read(ctx context.Context, req *einoPlantask.ReadRequest) (*einoFilesystem.FileContent, error) {
	b.syncPendingToSeaweedFS(ctx)

	localPath := b.scopeLocal(ctx, req.FilePath)
	// 优先 SeaweedFS
	if b.client != nil {
		remotePath := filepath.ToSlash(b.toRemotePath(ctx, req.FilePath))
		rc, err := b.client.SeaweedFSDownload(ctx, remotePath)
		if err == nil {
			defer rc.Close()
			data, err := io.ReadAll(rc)
			if err == nil {
				return &einoFilesystem.FileContent{Content: string(data)}, nil
			}
		}
	}

	// 回退本地
	data, err := os.ReadFile(localPath)
	if err != nil {
		return nil, err
	}
	return &einoFilesystem.FileContent{Content: string(data)}, nil
}

func (b *hybridBackend) Write(ctx context.Context, req *einoPlantask.WriteRequest) error {
	localPath := b.scopeLocal(ctx, req.FilePath)
	dir := filepath.Dir(localPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	content := []byte(req.Content)
	remotePath := filepath.ToSlash(b.toRemotePath(ctx, req.FilePath))

	// 优先 SeaweedFS
	if b.client != nil {
		reader := bytes.NewReader(content)
		if err := b.client.SeaweedFSUpload(ctx, remotePath, reader); err != nil {
			g.Log().Infof(ctx, "[plantask] SeaweedFS 上传失败，回退本地: %v", err)
		} else {
			return nil
		}
	}

	// 回退本地并加入待同步
	if err := os.WriteFile(localPath, content, 0644); err != nil {
		return err
	}
	return b.addPending(ctx, remotePath, localPath)
}

func (b *hybridBackend) Delete(ctx context.Context, req *einoPlantask.DeleteRequest) error {
	localPath := b.scopeLocal(ctx, req.FilePath)
	remotePath := filepath.ToSlash(b.toRemotePath(ctx, req.FilePath))
	if b.client != nil {
		_ = b.client.SeaweedFSDelete(remotePath, false)
	}
	return os.Remove(localPath)
}

// NewTools 创建 PlanTask 四个工具（TaskCreate/TaskGet/TaskUpdate/TaskList），供 ReAct Agent 使用
func NewTools(ctx context.Context) ([]tool.BaseTool, error) {
	baseDir := utility.FilesPlantaskLocalDir(ctx)
	absDir, err := filepath.Abs(baseDir)
	if err != nil {
		absDir = baseDir
	}
	if err := os.MkdirAll(absDir, 0755); err != nil {
		g.Log().Infof(ctx, "[plantask] MkdirAll failed: %v", err)
		return nil, err
	}

	client := FilerMode.GetDefaultClient()
	if client == nil {
		endpoint := "http://localhost:8888"
		if v, err := g.Cfg().Get(ctx, "seaweedfs.filer"); err == nil && v.String() != "" {
			endpoint = v.String()
		}
		client = FilerMode.NewFilerClient(endpoint)
	}

	backend := &hybridBackend{baseDir: absDir, client: client}
	mw, err := einoPlantask.New(ctx, &einoPlantask.Config{
		Backend: backend,
		BaseDir: absDir,
	})
	if err != nil {
		g.Log().Infof(ctx, "[plantask] New failed: %v", err)
		return nil, err
	}

	runCtx := &adk.ChatModelAgentContext{
		Tools: []tool.BaseTool{},
	}
	_, newCtx, err := mw.BeforeAgent(ctx, runCtx)
	if err != nil {
		return nil, err
	}

	g.Log().Infof(ctx, "[plantask] 已加载 TaskCreate/TaskGet/TaskUpdate/TaskList, baseDir=%s, 支持 SeaweedFS 与本地回退（按用户隔离）", absDir)
	return newCtx.Tools, nil
}
