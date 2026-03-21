// Package utility 提供本地数据目录解析，统一在 files.root（默认 Files）下管理子目录。
package utility

import (
	"context"
	"path/filepath"
	"strings"

	"github.com/gogf/gf/v2/frame/g"
)

const defaultFilesRoot = "Files"

// FilesRoot 返回配置项 files.root，未配置时为 "Files"（相对进程工作目录，一般为 backend/）。
func FilesRoot(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "files.root")
	if err != nil || strings.TrimSpace(v.String()) == "" {
		return defaultFilesRoot
	}
	return strings.TrimSpace(v.String())
}

// FilesUploadsDir 知识库索引器上传目录。优先 files.uploadsDir；否则 <files.root>/uploads。
func FilesUploadsDir(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "files.uploadsDir")
	if err == nil && strings.TrimSpace(v.String()) != "" {
		return strings.TrimSpace(v.String())
	}
	return filepath.Join(FilesRoot(ctx), "uploads")
}

// FilesPlantaskLocalDir PlanTask 本地 JSON 目录。优先 plantask.baseDir；否则 <files.root>/plantask。
// SeaweedFS 上的远程逻辑路径仍使用 plantask_tasks 前缀（见 plantask 包内常量），与本地文件夹名无关。
func FilesPlantaskLocalDir(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "plantask.baseDir")
	if err == nil && strings.TrimSpace(v.String()) != "" {
		return strings.TrimSpace(v.String())
	}
	return filepath.Join(FilesRoot(ctx), "plantask")
}

// FilesStudyPlansLocalDir 学习计划与 filesystem workdir 的根目录。优先 studyplan.localDir；否则 <files.root>/study_plans。
func FilesStudyPlansLocalDir(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "studyplan.localDir")
	if err == nil && strings.TrimSpace(v.String()) != "" {
		return strings.TrimSpace(v.String())
	}
	return filepath.Join(FilesRoot(ctx), "study_plans")
}

// FilesMinerUDir MinerU 解析结果（Markdown 等）缓存目录。优先 mineru.cacheDir；否则 <files.root>/mineru。
func FilesMinerUDir(ctx context.Context) string {
	v, err := g.Cfg().Get(ctx, "mineru.cacheDir")
	if err == nil && strings.TrimSpace(v.String()) != "" {
		return strings.TrimSpace(v.String())
	}
	return filepath.Join(FilesRoot(ctx), "mineru")
}
