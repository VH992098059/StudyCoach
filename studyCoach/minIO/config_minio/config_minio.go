package config_minio

import (
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"log"
	"os"
)

type MinIOConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	UseSSL          bool
	BucketName      string
}

// CreateMinio 创建MinIO客户端
func CreateMinio() (*minio.Client, error) {
	config := &MinIOConfig{
		Endpoint:        getEnv("MINIO_ENDPOINT", "localhost:9000"),
		AccessKeyID:     getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		SecretAccessKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		UseSSL:          false,
		BucketName:      getEnv("MINIO_BUCKET", "study-coach"),
	}

	// 创建MinIO客户端
	minioClient, err := minio.New(config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.UseSSL,
	})
	if err != nil {
		log.Printf("Failed to create MinIO client: %v", err)
		return nil, err
	}

	log.Printf("MinIO client created successfully, endpoint: %s", config.Endpoint)
	return minioClient, nil
}

// GetFilePrefix 获取文件前缀
func GetFilePrefix(fileType string) string {
	switch fileType {
	case "image":
		return "images/"
	case "document":
		return "documents/"
	case "video":
		return "videos/"
	default:
		return "files/"
	}
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
