package ai_chat

import (
	v1 "backend/api/ai_chat/v1"
	"backend/studyCoach/aiModel/eino_tools/filesystem"
	"context"
	"path/filepath"

	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) UploadChatFile(ctx context.Context, req *v1.UploadChatFileReq) (res *v1.UploadChatFileRes, err error) {
	workDir, err := filesystem.GetWorkDirForSession(ctx, req.Id)
	if err != nil {
		g.Log().Errorf(ctx, "[UploadChatFile] GetWorkDirForSession failed: %v", err)
		return nil, err
	}

	// 从请求中获取上传的文件（字段名为 files，支持多文件）
	httpReq := g.RequestFromCtx(ctx)
	uploadFiles := httpReq.GetUploadFiles("files")
	if len(uploadFiles) == 0 {
		return &v1.UploadChatFileRes{FileNames: []string{}}, nil
	}

	var savedNames []string
	for _, uf := range uploadFiles {
		// 使用原始文件名，若重名则加后缀（Save 的 randomlyRename 可避免覆盖）
		filename, err := uf.Save(workDir, true)
		if err != nil {
			g.Log().Errorf(ctx, "[UploadChatFile] Save file failed: %v", err)
			return nil, err
		}
		// filename 可能是带路径的，取 basename 作为相对 workdir 的路径
		savedNames = append(savedNames, filepath.Base(filename))
	}

	g.Log().Infof(ctx, "[UploadChatFile] 已保存 %d 个文件到会话 %s: %v", len(savedNames), req.Id, savedNames)
	return &v1.UploadChatFileRes{FileNames: savedNames}, nil
}
