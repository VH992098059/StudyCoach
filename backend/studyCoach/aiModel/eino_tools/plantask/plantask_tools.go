// Package plantask 提供 PlanTask 工具的公共实现（TaskCreate/TaskGet/TaskUpdate/TaskList），供 CoachChat、NormalChat 等复用。
// 优先存储到 SeaweedFS；若未启动则退回到本地，SeaweedFS 启动后再同步上传，并做重复上传判断。
package plantask

import (
	"backend/studyCoach/seaweedFS/FilerMode"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/cloudwego/eino/adk"
	einoPlantask "github.com/cloudwego/eino/adk/middlewares/plantask"
	"github.com/cloudwego/eino/components/tool"
	"github.com/gogf/gf/v2/frame/g"
)

const plantaskRemoteBase = "plantask_tasks"
const pendingFileName = "_pending_upload.json"

// pendingEntry 待同步记录
type pendingEntry struct {
	RemotePath string `json:"remote_path"`
	LocalPath  string `json:"local_path"`
}

// hybridBackend 混合存储：SeaweedFS 优先，本地回退，支持启动后同步与去重
type hybridBackend struct {
	baseDir string
	client  *FilerMode.FilerClient
	mu      sync.Mutex
}

func (b *hybridBackend) toRemotePath(localPath string) string {
	rel, err := filepath.Rel(b.baseDir, localPath)
	if err != nil {
		return strings.ReplaceAll(localPath, "\\", "/")
	}
	return filepath.Join(plantaskRemoteBase, rel)
}

func (b *hybridBackend) loadPending() ([]pendingEntry, error) {
	p := filepath.Join(b.baseDir, pendingFileName)
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

func (b *hybridBackend) savePending(list []pendingEntry) error {
	p := filepath.Join(b.baseDir, pendingFileName)
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0644)
}

func (b *hybridBackend) addPending(remotePath, localPath string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	list, err := b.loadPending()
	if err != nil {
		return err
	}
	for _, e := range list {
		if e.RemotePath == remotePath {
			return nil
		}
	}
	list = append(list, pendingEntry{RemotePath: remotePath, LocalPath: localPath})
	return b.savePending(list)
}

func (b *hybridBackend) removePending(remotePath string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	list, err := b.loadPending()
	if err != nil {
		return err
	}
	var newList []pendingEntry
	for _, e := range list {
		if e.RemotePath != remotePath {
			newList = append(newList, e)
		}
	}
	return b.savePending(newList)
}

func (b *hybridBackend) syncPendingToSeaweedFS(ctx context.Context) {
	if b.client == nil {
		return
	}
	b.mu.Lock()
	list, err := b.loadPending()
	b.mu.Unlock()
	if err != nil || len(list) == 0 {
		return
	}
	for _, e := range list {
		exists, err := b.client.SeaweedFSExists(ctx, e.RemotePath)
		if err != nil || exists {
			if exists {
				_ = b.removePending(e.RemotePath)
			}
			continue
		}
		data, err := os.ReadFile(e.LocalPath)
		if err != nil {
			log.Printf("[plantask] 同步时读取本地失败 %s: %v", e.LocalPath, err)
			continue
		}
		reader := bytes.NewReader(data)
		if err := b.client.SeaweedFSUpload(ctx, e.RemotePath, reader); err != nil {
			log.Printf("[plantask] 同步上传失败 %s: %v", e.RemotePath, err)
			continue
		}
		_ = b.removePending(e.RemotePath)
		log.Printf("[plantask] 已同步到 SeaweedFS: %s", e.RemotePath)
	}
}

func (b *hybridBackend) LsInfo(ctx context.Context, req *einoPlantask.LsInfoRequest) ([]einoPlantask.FileInfo, error) {
	path := filepath.Clean(req.Path)
	if path == "" {
		path = b.baseDir
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

func (b *hybridBackend) Read(ctx context.Context, req *einoPlantask.ReadRequest) (string, error) {
	b.syncPendingToSeaweedFS(ctx)

	// 优先 SeaweedFS
	if b.client != nil {
		remotePath := filepath.ToSlash(b.toRemotePath(req.FilePath))
		rc, err := b.client.SeaweedFSDownload(ctx, remotePath)
		if err == nil {
			defer rc.Close()
			data, err := io.ReadAll(rc)
			if err == nil {
				return string(data), nil
			}
		}
	}

	// 回退本地
	data, err := os.ReadFile(req.FilePath)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (b *hybridBackend) Write(ctx context.Context, req *einoPlantask.WriteRequest) error {
	dir := filepath.Dir(req.FilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	content := []byte(req.Content)
	remotePath := filepath.ToSlash(b.toRemotePath(req.FilePath))

	// 优先 SeaweedFS
	if b.client != nil {
		reader := bytes.NewReader(content)
		if err := b.client.SeaweedFSUpload(ctx, remotePath, reader); err != nil {
			log.Printf("[plantask] SeaweedFS 上传失败，回退本地: %v", err)
		} else {
			return nil
		}
	}

	// 回退本地并加入待同步
	if err := os.WriteFile(req.FilePath, content, 0644); err != nil {
		return err
	}
	return b.addPending(remotePath, req.FilePath)
}

func (b *hybridBackend) Delete(ctx context.Context, req *einoPlantask.DeleteRequest) error {
	remotePath := filepath.ToSlash(b.toRemotePath(req.FilePath))
	if b.client != nil {
		_ = b.client.SeaweedFSDelete(remotePath, false)
	}
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
		log.Printf("[plantask] MkdirAll failed: %v", err)
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
		log.Printf("[plantask] New failed: %v", err)
		return nil, err
	}

	runCtx := &adk.ChatModelAgentContext{
		Tools: []tool.BaseTool{},
	}
	_, newCtx, err := mw.BeforeAgent(ctx, runCtx)
	if err != nil {
		return nil, err
	}

	log.Printf("[plantask] 已加载 TaskCreate/TaskGet/TaskUpdate/TaskList, baseDir=%s, 支持 SeaweedFS 与本地回退", absDir)
	return newCtx.Tools, nil
}
