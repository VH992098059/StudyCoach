// Package studyplan 提供学习计划持久化工具（save_plan/read_plan），供 CoachChat 使用。
// 优先存储到 SeaweedFS；若未启动则退回到本地，SeaweedFS 启动后再同步上传，并做重复上传判断。
package studyplan

import (
	"backend/studyCoach/seaweedFS/FilerMode"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

const (
	basePath     = "study_plans"
	planFileName = "Study_Plan.md"
	localBase    = "study_plans_local"
	pendingFile  = "_pending.json"
)

// SessionIDContextKey 用于在 context 中传递 session_id
type SessionIDContextKey struct{}

func getSessionID(ctx context.Context) string {
	if v := ctx.Value(SessionIDContextKey{}); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return ""
}

// planStorage 混合存储：SeaweedFS 优先，本地回退，支持启动后同步与去重
type planStorage struct {
	client       *FilerMode.FilerClient
	localBaseDir string
	mu           sync.Mutex
}

// pendingEntry 待同步记录
type pendingEntry struct {
	RemotePath string `json:"remote_path"`
	LocalPath  string `json:"local_path"`
}

func (s *planStorage) loadPending() ([]pendingEntry, error) {
	p := filepath.Join(s.localBaseDir, pendingFile)
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

func (s *planStorage) savePending(list []pendingEntry) error {
	p := filepath.Join(s.localBaseDir, pendingFile)
	dir := filepath.Dir(p)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0644)
}

func (s *planStorage) addPending(remotePath, localPath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	list, err := s.loadPending()
	if err != nil {
		return err
	}
	for _, e := range list {
		if e.RemotePath == remotePath {
			return nil
		}
	}
	list = append(list, pendingEntry{RemotePath: remotePath, LocalPath: localPath})
	return s.savePending(list)
}

func (s *planStorage) removePending(remotePath string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	list, err := s.loadPending()
	if err != nil {
		return err
	}
	var newList []pendingEntry
	for _, e := range list {
		if e.RemotePath != remotePath {
			newList = append(newList, e)
		}
	}
	return s.savePending(newList)
}

// isSeaweedFSAvailable 检测 SeaweedFS 是否可用
func (s *planStorage) isSeaweedFSAvailable(ctx context.Context) bool {
	if s.client == nil {
		return false
	}
	_, err := s.client.SeaweedFSList(ctx, basePath)
	return err == nil
}

// save 保存计划：优先 SeaweedFS，失败则本地 + 加入待同步
func (s *planStorage) save(ctx context.Context, remotePath string, content []byte) error {
	if s.client != nil {
		reader := bytes.NewReader(content)
		if err := s.client.SeaweedFSUpload(ctx, remotePath, reader); err != nil {
			log.Printf("[save_plan] SeaweedFS 上传失败，回退本地: %v", err)
		} else {
			return nil
		}
	}

	localPath := filepath.Join(s.localBaseDir, remotePath)
	dir := filepath.Dir(localPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建本地目录失败: %v", err)
	}
	if err := os.WriteFile(localPath, content, 0644); err != nil {
		return fmt.Errorf("写入本地文件失败: %v", err)
	}
	return s.addPending(remotePath, localPath)
}

// read 读取：优先 SeaweedFS，失败则本地
func (s *planStorage) read(ctx context.Context, remotePath string) ([]byte, error) {
	if s.client != nil {
		rc, err := s.client.SeaweedFSDownload(ctx, remotePath)
		if err == nil {
			defer rc.Close()
			return io.ReadAll(rc)
		}
	}
	localPath := filepath.Join(s.localBaseDir, remotePath)
	return os.ReadFile(localPath)
}

// list 列出目录：优先 SeaweedFS，失败则本地
func (s *planStorage) list(ctx context.Context, remotePath string) ([]string, error) {
	if s.client != nil {
		names, err := s.client.SeaweedFSList(ctx, remotePath)
		if err == nil {
			return names, nil
		}
	}
	localPath := filepath.Join(s.localBaseDir, remotePath)
	entries, err := os.ReadDir(localPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var names []string
	for _, e := range entries {
		names = append(names, e.Name())
	}
	return names, nil
}

// syncPendingToSeaweedFS 将本地待同步文件上传到 SeaweedFS，带去重判断
func (s *planStorage) syncPendingToSeaweedFS(ctx context.Context) {
	if s.client == nil {
		return
	}
	s.mu.Lock()
	list, err := s.loadPending()
	s.mu.Unlock()
	if err != nil || len(list) == 0 {
		return
	}
	for _, e := range list {
		exists, err := s.client.SeaweedFSExists(ctx, e.RemotePath)
		if err != nil || exists {
			if exists {
				_ = s.removePending(e.RemotePath)
			}
			continue
		}
		data, err := os.ReadFile(e.LocalPath)
		if err != nil {
			log.Printf("[save_plan] 同步时读取本地失败 %s: %v", e.LocalPath, err)
			continue
		}
		reader := bytes.NewReader(data)
		if err := s.client.SeaweedFSUpload(ctx, e.RemotePath, reader); err != nil {
			log.Printf("[save_plan] 同步上传失败 %s: %v", e.RemotePath, err)
			continue
		}
		_ = s.removePending(e.RemotePath)
		log.Printf("[save_plan] 已同步到 SeaweedFS: %s", e.RemotePath)
	}
}

// SavePlanTool 保存学习计划
type SavePlanTool struct {
	storage *planStorage
}

// Info 返回工具信息
func (t *SavePlanTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "save_plan",
		Desc: `当用户明确确认采纳当前学习计划时，调用此工具将计划保存为 MD 文件并上传到云端。
调用时机：用户说「确定」「就这个」「好，保存」「采纳」等明确表示确认的词语。
参数：plan_title 为学习内容标题（如「Go语言学习计划」），content 为完整的 Markdown 计划内容。`,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"plan_title": {
				Type:     schema.String,
				Desc:     "学习计划标题，如：Go语言学习计划",
				Required: true,
			},
			"content": {
				Type:     schema.String,
				Desc:     "完整的 Markdown 格式学习计划内容",
				Required: true,
			},
		}),
	}, nil
}

// InvokableRun 执行保存
func (t *SavePlanTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var args struct {
		PlanTitle string `json:"plan_title"`
		Content   string `json:"content"`
	}
	if err := json.Unmarshal([]byte(argumentsInJSON), &args); err != nil {
		return "", fmt.Errorf("参数解析失败: %v", err)
	}
	if args.PlanTitle == "" || args.Content == "" {
		return "", fmt.Errorf("plan_title 和 content 不能为空")
	}

	sessionID := getSessionID(ctx)
	if sessionID == "" {
		return "", fmt.Errorf("无法获取会话 ID，请确保在对话上下文中")
	}

	timestamp := time.Now().Format("20060102_150405")
	safeTitle := sanitizePath(args.PlanTitle)
	remotePath := fmt.Sprintf("%s/%s/%s/%s/%s", basePath, sessionID, safeTitle, timestamp, planFileName)

	if err := t.storage.save(ctx, remotePath, []byte(args.Content)); err != nil {
		return "", fmt.Errorf("保存计划失败: %v", err)
	}

	log.Printf("[save_plan] 已保存: %s", remotePath)
	return fmt.Sprintf("学习计划已保存成功。路径：%s，创建时间：%s", remotePath, timestamp), nil
}

// ReadPlanTool 读取学习计划
type ReadPlanTool struct {
	storage *planStorage
}

// Info 返回工具信息
func (t *ReadPlanTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "read_plan",
		Desc: `当用户要求修改或更新已有学习计划时，先调用此工具读取现有计划内容。
调用时机：用户说「修改计划」「更新计划」「在现有基础上延伸」等。
参数：plan_title 为学习内容标题。若不传或传空，则列出当前会话下所有已保存的计划标题。`,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"plan_title": {
				Type:     schema.String,
				Desc:     "学习计划标题，如：Go语言学习计划。不传则列出所有计划",
				Required: false,
			},
		}),
	}, nil
}

// InvokableRun 执行读取
func (t *ReadPlanTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var args struct {
		PlanTitle string `json:"plan_title"`
	}
	_ = json.Unmarshal([]byte(argumentsInJSON), &args)

	sessionID := getSessionID(ctx)
	if sessionID == "" {
		return "", fmt.Errorf("无法获取会话 ID")
	}

	// 每次读取时尝试同步本地待上传到 SeaweedFS
	t.storage.syncPendingToSeaweedFS(ctx)

	sessionPath := fmt.Sprintf("%s/%s", basePath, sessionID)

	if args.PlanTitle == "" {
		plans, err := t.storage.list(ctx, sessionPath)
		if err != nil {
			return "", fmt.Errorf("列出计划失败: %v", err)
		}
		if len(plans) == 0 {
			return "当前会话下暂无已保存的学习计划。", nil
		}
		return fmt.Sprintf("已保存的计划标题：%s", strings.Join(plans, "、")), nil
	}

	safeTitle := sanitizePath(args.PlanTitle)
	planPath := fmt.Sprintf("%s/%s", sessionPath, safeTitle)
	versions, err := t.storage.list(ctx, planPath)
	if err != nil {
		return "", fmt.Errorf("读取计划失败: %v", err)
	}
	if len(versions) == 0 {
		return fmt.Sprintf("未找到标题为「%s」的学习计划。", args.PlanTitle), nil
	}

	sort.Sort(sort.Reverse(sort.StringSlice(versions)))
	latest := versions[0]
	filePath := fmt.Sprintf("%s/%s/%s", planPath, latest, planFileName)

	data, err := t.storage.read(ctx, filePath)
	if err != nil {
		return "", fmt.Errorf("下载计划失败: %v", err)
	}
	content := string(data)
	if content == "" {
		return "计划内容为空。", nil
	}
	return fmt.Sprintf("【计划标题】%s\n【版本】%s\n【内容】\n%s", args.PlanTitle, latest, content), nil
}

func sanitizePath(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "/", "_")
	s = strings.ReplaceAll(s, "\\", "_")
	s = strings.ReplaceAll(s, "..", "_")
	return s
}

// NewTools 创建 save_plan 和 read_plan 工具
func NewTools(ctx context.Context) ([]tool.BaseTool, error) {
	localDir := localBase
	if v, err := g.Cfg().Get(ctx, "studyplan.localDir"); err == nil && v.String() != "" {
		localDir = v.String()
	}
	absDir, err := filepath.Abs(localDir)
	if err != nil {
		absDir = localDir
	}
	if err := os.MkdirAll(absDir, 0755); err != nil {
		return nil, fmt.Errorf("创建本地存储目录失败: %v", err)
	}

	client := FilerMode.GetDefaultClient()
	if client == nil {
		endpoint := "http://localhost:8888"
		if v, err := g.Cfg().Get(ctx, "seaweedfs.filer"); err == nil && v.String() != "" {
			endpoint = v.String()
		}
		client = FilerMode.NewFilerClient(endpoint)
	}

	storage := &planStorage{
		client:       client,
		localBaseDir: absDir,
	}

	saveTool := &SavePlanTool{storage: storage}
	readTool := &ReadPlanTool{storage: storage}
	log.Printf("[studyplan] 已加载 save_plan/read_plan，本地回退目录: %s", absDir)
	return []tool.BaseTool{saveTool, readTool}, nil
}
