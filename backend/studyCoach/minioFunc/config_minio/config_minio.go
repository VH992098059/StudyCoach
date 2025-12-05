package config_minio

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinIOConfig struct {
	EndpointAddr    string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	BucketName      string
}

func CreateMinio(config MinIOConfig) (*minio.Client, error) {
	client, err := minio.New(config.EndpointAddr, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("MinIO客户端创建失败：%w", err)
	}
	return client, nil
}

// GetFilePrefix 获取文件前缀
func GetFilePrefix(filename string) string {
	fmt.Println("获取文件名：", filename)
	base := filepath.Base(filename)
	ext := filepath.Ext(filename)
	return strings.TrimSuffix(base, ext)
}
