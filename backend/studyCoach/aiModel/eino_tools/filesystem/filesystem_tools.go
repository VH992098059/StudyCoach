// Package filesystem 提供 read_file、write_file、execute 工具，供 ReActLambda 处理文件相关任务。
// 工作目录按 session_id 隔离，路径限制在 baseDir 内，防止越权访问。
package filesystem

import (
	"backend/studyCoach/aiModel/eino_tools/studyplan"
	"backend/utility"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"unicode/utf8"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

// GetWorkDirForSession 根据 sessionID 返回会话工作目录，供上传等场景使用
func GetWorkDirForSession(ctx context.Context, sessionID string) (string, error) {
	if sessionID == "" {
		return "", fmt.Errorf("无法获取会话 ID")
	}
	base := filepath.Join(utility.FilesRoot(ctx), "uploads", "workdir")
	workDir := filepath.Join(base, sessionID)
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return "", fmt.Errorf("创建工作目录失败: %v", err)
	}
	abs, err := filepath.Abs(workDir)
	if err != nil {
		return workDir, nil
	}
	return abs, nil
}

func getWorkDir(ctx context.Context) (string, error) {
	sessionID := ""
	if v := ctx.Value(studyplan.SessionIDContextKey{}); v != nil {
		if s, ok := v.(string); ok && s != "" {
			sessionID = s
		}
	}
	return GetWorkDirForSession(ctx, sessionID)
}

// resolvePath 将相对路径解析到工作目录内，防止 path traversal
func resolvePath(ctx context.Context, relPath string) (string, error) {
	workDir, err := getWorkDir(ctx)
	if err != nil {
		return "", err
	}
	relPath = filepath.Clean(relPath)
	if relPath == ".." || strings.HasPrefix(relPath, ".."+string(filepath.Separator)) {
		return "", fmt.Errorf("路径不允许越出工作目录")
	}
	full := filepath.Join(workDir, relPath)
	absFull, err := filepath.Abs(full)
	if err != nil {
		return "", err
	}
	absWork, _ := filepath.Abs(workDir)
	if !strings.HasPrefix(absFull, absWork) {
		return "", fmt.Errorf("路径不允许越出工作目录")
	}
	return absFull, nil
}

// ReadFileTool 读取文件内容
type ReadFileTool struct{}

func (t *ReadFileTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "read_file",
		Desc: `读取工作目录内的文件内容。用于处理 CSV、TXT、JSON 等文件。
参数：path 为相对于工作目录的文件路径（如 "data.csv"、"output/result.txt"）。`,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"path": {
				Type:     schema.String,
				Desc:     "文件路径，相对于会话工作目录",
				Required: true,
			},
		}),
	}, nil
}

func (t *ReadFileTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var args struct {
		Path string `json:"path"`
	}
	if err := parseJSON(argumentsInJSON, &args); err != nil {
		return "", err
	}
	if args.Path == "" {
		return "", fmt.Errorf("path 不能为空")
	}

	fullPath, err := resolvePath(ctx, args.Path)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(fullPath)
	if err != nil {
		return "", fmt.Errorf("读取文件失败: %v", err)
	}
	return string(data), nil
}

// WriteFileTool 写入文件
type WriteFileTool struct{}

func (t *WriteFileTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "write_file",
		Desc: `将内容写入工作目录内的文件。用于生成 CSV、TXT、JSON 等文件。
参数：path 为相对路径，content 为要写入的内容。若目录不存在会自动创建。`,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"path": {
				Type:     schema.String,
				Desc:     "文件路径，相对于会话工作目录",
				Required: true,
			},
			"content": {
				Type:     schema.String,
				Desc:     "要写入的文件内容",
				Required: true,
			},
		}),
	}, nil
}

func (t *WriteFileTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var args struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}
	if err := parseJSON(argumentsInJSON, &args); err != nil {
		return "", err
	}
	if args.Path == "" {
		return "", fmt.Errorf("path 不能为空")
	}

	fullPath, err := resolvePath(ctx, args.Path)
	if err != nil {
		return "", err
	}
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("创建目录失败: %v", err)
	}
	if err := os.WriteFile(fullPath, []byte(args.Content), 0644); err != nil {
		return "", fmt.Errorf("写入文件失败: %v", err)
	}
	return fmt.Sprintf("已成功写入文件: %s", args.Path), nil
}

// mapWindowsCommand 将常见 Unix 命令映射为 Windows cmd 等效命令，避免 "不是内部或外部命令" 错误
func mapWindowsCommand(cmd string) string {
	trimmed := strings.TrimSpace(cmd)
	lower := strings.ToLower(trimmed)
	// pwd -> cd（cmd 中 cd 无参数时输出当前目录）
	if lower == "pwd" {
		return "cd"
	}
	// ls / ls -la 等 -> dir（Windows dir 参数不同，仅做基本映射）
	if lower == "ls" || strings.HasPrefix(lower, "ls ") {
		return "dir"
	}
	return cmd
}

// decodeWindowsOutput 将 Windows cmd 输出的 GBK 转为 UTF-8，若已是有效 UTF-8 则原样返回
func decodeWindowsOutput(b []byte) string {
	if utf8.Valid(b) {
		return string(b)
	}
	decoder := simplifiedchinese.GBK.NewDecoder()
	r := transform.NewReader(bytes.NewReader(b), decoder)
	decoded, err := io.ReadAll(r)
	if err != nil {
		return string(b) // 解码失败时返回原文
	}
	return string(decoded)
}

// ExecuteTool 在工作目录内执行 Shell 命令
type ExecuteTool struct{}

func (t *ExecuteTool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "execute",
		Desc: `在工作目录内执行 Shell 命令。用于运行 Python 脚本、数据处理命令等。
参数：command 为要执行的命令（如 "python process.py"、"ls -la"）。
注意：命令在工作目录内执行，请使用相对路径引用文件。
【重要限制】不支持图片处理和 OCR 命令（如 tesseract、imagemagick 等）。图片内容请直接通过多模态能力识别，无需调用外部工具。`,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"command": {
				Type:     schema.String,
				Desc:     "要执行的 Shell 命令",
				Required: true,
			},
		}),
	}, nil
}

func (t *ExecuteTool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var args struct {
		Command string `json:"command"`
	}
	if err := parseJSON(argumentsInJSON, &args); err != nil {
		return "", err
	}
	if args.Command == "" {
		return "", fmt.Errorf("command 不能为空")
	}

	workDir, err := getWorkDir(ctx)
	if err != nil {
		return "", err
	}

	command := args.Command
	if runtime.GOOS == "windows" {
		command = mapWindowsCommand(command)
	}

	var shellCmd []string
	switch runtime.GOOS {
	case "windows":
		shellCmd = []string{"cmd.exe", "/C", command}
	default:
		shellCmd = []string{"/bin/sh", "-c", command}
	}

	execCmd := exec.CommandContext(ctx, shellCmd[0], shellCmd[1:]...)
	execCmd.Dir = workDir

	// 设置环境变量以支持UTF-8编码
	execCmd.Env = append(os.Environ(), "PYTHONIOENCODING=utf-8")

	out, err := execCmd.CombinedOutput()
	outStr := string(out)
	if runtime.GOOS == "windows" {
		outStr = decodeWindowsOutput(out)
	}
	if err != nil {
		return "", fmt.Errorf("执行失败: %v\n输出: %s", err, outStr)
	}
	return outStr, nil
}

func parseJSON(s string, v interface{}) error {
	return json.Unmarshal([]byte(s), v)
}

// NewTools 返回 read_file、write_file、execute 工具
func NewTools(ctx context.Context) ([]tool.BaseTool, error) {
	return []tool.BaseTool{
		&ReadFileTool{},
		&WriteFileTool{},
		&ExecuteTool{},
	}, nil
}
