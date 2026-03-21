// Package mineruworker 在索引前将 PDF（本地路径或 http(s) URL）经 MinerU 精准解析为 Markdown 文件。
package mineruworker

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/utility"

	"github.com/gogf/gf/v2/frame/g"
	mu "github.com/opendatalab/MinerU-Ecosystem/sdk/go"
)

// IsPDFPath 根据扩展名判断是否为 PDF（本地路径或 URL 路径部分）。
func IsPDFPath(s string) bool {
	s = strings.TrimSpace(s)
	if s == "" {
		return false
	}
	// 去掉查询串再取扩展名
	if i := strings.IndexAny(s, "?#"); i >= 0 {
		s = s[:i]
	}
	return strings.EqualFold(filepath.Ext(s), ".pdf")
}

// ExtractPDFToMarkdownFile 使用 MinerU 精准解析（默认开启 OCR），将 Markdown 写入 <files.root>/mineru/doc_{documentsId}/extracted.md。
// source 可为本地绝对/相对路径，或 http(s) 指向的 PDF。
func ExtractPDFToMarkdownFile(ctx context.Context, source string, documentsId int64) (mdAbsPath string, err error) {
	token := getToken(ctx)
	if token == "" {
		return "", fmt.Errorf("未配置 mineru.token 或环境变量 MINERU_TOKEN，无法解析 PDF")
	}
	if !isMinerUEnabled(ctx) {
		return "", fmt.Errorf("mineru.enabled 为 false，已关闭 MinerU PDF 解析")
	}

	client, err := mu.New(token)
	if err != nil {
		return "", fmt.Errorf("MinerU 客户端初始化失败: %w", err)
	}

	poll := pollTimeout(ctx)
	opts := []mu.ExtractOption{
		mu.WithOCR(true),
		mu.WithPollTimeout(poll),
	}

	g.Log().Infof(ctx, "[MinerU] 开始精准解析 PDF, documentsId=%d source=%s poll=%v", documentsId, source, poll)
	result, err := client.Extract(ctx, source, opts...)
	if err != nil {
		return "", fmt.Errorf("MinerU Extract 失败: %w", err)
	}
	if err := result.Err(); err != nil {
		return "", fmt.Errorf("MinerU 任务失败: %w", err)
	}
	if strings.TrimSpace(result.Markdown) == "" {
		return "", fmt.Errorf("MinerU 返回空 Markdown，State=%s", result.State)
	}

	outDir := filepath.Join(utility.FilesMinerUDir(ctx), fmt.Sprintf("doc_%d", documentsId))
	if err := os.MkdirAll(outDir, 0755); err != nil {
		return "", fmt.Errorf("创建 MinerU 缓存目录失败: %w", err)
	}
	mdPath := filepath.Join(outDir, "extracted.md")
	if err := os.WriteFile(mdPath, []byte(result.Markdown), 0644); err != nil {
		return "", fmt.Errorf("写入 Markdown 失败: %w", err)
	}
	abs, err := filepath.Abs(mdPath)
	if err != nil {
		return mdPath, nil
	}
	g.Log().Infof(ctx, "[MinerU] 解析完成, md=%s bytes=%d", abs, len(result.Markdown))
	return abs, nil
}

func getToken(ctx context.Context) string {
	if v, err := g.Cfg().Get(ctx, "mineru.token"); err == nil {
		if t := strings.TrimSpace(v.String()); t != "" {
			return t
		}
	}
	return strings.TrimSpace(os.Getenv("MINERU_TOKEN"))
}

func isMinerUEnabled(ctx context.Context) bool {
	v, err := g.Cfg().Get(ctx, "mineru.enabled")
	if err != nil || strings.TrimSpace(v.String()) == "" {
		return true
	}
	return v.Bool()
}

func pollTimeout(ctx context.Context) time.Duration {
	v, err := g.Cfg().Get(ctx, "mineru.pollTimeout")
	if err != nil || strings.TrimSpace(v.String()) == "" {
		return 15 * time.Minute
	}
	d, err := time.ParseDuration(strings.TrimSpace(v.String()))
	if err != nil {
		return 15 * time.Minute
	}
	return d
}
