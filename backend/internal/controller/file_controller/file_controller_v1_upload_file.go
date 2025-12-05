package file_controller

import (
	"backend/studyCoach/minioFunc/minio_func"
	"backend/utility"
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/gogf/gf/v2/frame/g"

	v1 "backend/api/file_controller/v1"
)

func (c *ControllerV1) UploadFile(ctx context.Context, req *v1.UploadFileReq) (res *v1.UploadFileRes, err error) {
	config := utility.MinioConfig(ctx)
	if minio_func.GetContentType(filepath.Ext(req.UploadFile.Filename)) != "application/octet-stream" {
		config.BucketName = g.Cfg().MustGet(ctx, "minio.bucketImages").String()
	}
	saveTemp, err := req.UploadFile.Save("uploads/temp/")
	if err != nil {
		return nil, err
	}
	filePath := "uploads/temp/" + saveTemp
	defer os.Remove(filePath)
	file, s, err := minio_func.ResumableUploadFile(config, filePath)
	if err != nil {
		return nil, err
	}

	return &v1.UploadFileRes{
		FileURL: s,
		Size:    FormatBytes(file.Size),
	}, nil
}

// FormatBytes 简单的字节转换函数
func FormatBytes(bytes int64) string {
	if bytes < 1024 {
		return fmt.Sprintf("%dB", bytes)
	}

	kb := float64(bytes) / 1024
	if kb < 1024 {
		return fmt.Sprintf("%.2fKB", kb)
	}

	mb := kb / 1024
	if mb < 1024 {
		return fmt.Sprintf("%.2fMB", mb)
	}

	gb := mb / 1024
	return fmt.Sprintf("%.2fGB", gb)
}
