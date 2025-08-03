package indexer

import (
	"context"
	"fmt"
	"github.com/cloudwego/eino/schema"
	"path/filepath"
	"strings"
	"studyCoach/studyCoach/minIO/config_minio"
	"studyCoach/studyCoach/minIO/minio_func"
)

type ImageParser struct {
	config *config_minio.MinIOConfig
}

// 创建图片解析器实例
func NewImageParser(config *config_minio.MinIOConfig) *ImageParser {
	return &ImageParser{
		config: config,
	}
}

func (impl *ImageParser) Parse(ctx context.Context, doc *schema.Document) ([]schema.Document, error) {
	if !isImageExt(doc.ID) {
		return []schema.Document{*doc}, nil
	}
	newDoc := schema.Document{
		ID:       doc.ID,
		Content:  doc.Content,
		MetaData: make(map[string]any),
	}
	for k, v := range doc.MetaData {
		newDoc.MetaData[k] = v
	}
	//标记为图片文件，能为后续转换识别
	newDoc.MetaData["file_type"] = "image"
	newDoc.MetaData["_extension"] = strings.ToLower(filepath.Ext(doc.ID))
	newDoc.MetaData["requires_vision_processing"] = true
	configMinio := config_minio.MinIOConfig{
		EndpointAddr:    impl.config.EndpointAddr,
		AccessKeyID:     impl.config.AccessKeyID,
		SecretAccessKey: impl.config.SecretAccessKey,
		UseSSL:          false,
		BucketName:      impl.config.BucketName,
	}
	if strings.Contains(doc.ID, "localhost:9000") || strings.Contains(doc.ID, configMinio.EndpointAddr) {
		objectName := extractObjectNameFromURL(doc.ID)
		imageData, err := minio_func.DownloadFromMinIOToMemory(configMinio, objectName)
		if err != nil {
			return nil, fmt.Errorf("从 MinIO 下载图片失败: %w", err)
		}
		newDoc.MetaData["image_data"] = imageData
		newDoc.MetaData["source_type"] = "minio"
		newDoc.MetaData["image_size"] = len(imageData)
		// 设置内容为图片的基本信息
		newDoc.Content = fmt.Sprintf("图片文件: %s, 大小: %d 字节", filepath.Base(doc.ID), len(imageData))
	}
	return []schema.Document{newDoc}, nil
}

// 辅助函数：从 URL 中提取对象名称
func extractObjectNameFromURL(urlStr string) string {
	parts := strings.Split(urlStr, "/")
	if len(parts) >= 2 {
		return strings.Join(parts[2:], "/")
	}
	return urlStr
}

// 图片文件扩展名
var ImageExt = map[string]bool{
	".jpg":  true,
	".png":  true,
	".jpeg": true,
	".gif":  true,
	".bmp":  true,
	".svg":  true,
	".webp": true,
	".ico":  true,
	".tiff": true,
	".raw":  true,
}

func isImageExt(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ImageExt[ext]
}
