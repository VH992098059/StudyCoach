package file_controller

import (
	v1 "backend/api/file_controller/v1"
	"context"
	"fmt"
)

func (c *ControllerV1) UploadFile(ctx context.Context, req *v1.UploadFileReq) (res *v1.UploadFileRes, err error) {
	//TODO

	return
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
