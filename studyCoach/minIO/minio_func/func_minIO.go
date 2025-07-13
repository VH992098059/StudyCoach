package minio_func

import (
	"bytes"
	"context"
	"fmt"
	"github.com/minio/minio-go/v7"
	"io"
	"log"
	"strings"
)

// SearchObjectsMinIO 根据模式搜索MinIO中的对象
func SearchObjectsMinIO(client *minio.Client, bucketName, pattern string) ([]string, error) {
	var objects []string

	// 列出对象
	objectCh := client.ListObjects(context.Background(), bucketName, minio.ListObjectsOptions{
		Prefix:    pattern,
		Recursive: true,
	})

	for object := range objectCh {
		if object.Err != nil {
			return nil, fmt.Errorf("error listing objects: %v", object.Err)
		}
		objects = append(objects, object.Key)
	}

	return objects, nil
}

// DownloadFromMinIOToMemory 从MinIO下载文件到内存
func DownloadFromMinIOToMemory(client *minio.Client, bucketName, objectName string) ([]byte, error) {
	// 获取对象
	object, err := client.GetObject(context.Background(), bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %v", err)
	}
	defer object.Close()

	// 读取对象内容到内存
	data, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("failed to read object: %v", err)
	}

	return data, nil
}

// DownloadFromMinIOByPattern 通过模糊匹配下载文件
func DownloadFromMinIOByPattern(client *minio.Client, bucketName, pattern string) (map[string][]byte, error) {
	result := make(map[string][]byte)

	// 搜索匹配的对象
	objects, err := SearchObjectsMinIO(client, bucketName, pattern)
	if err != nil {
		return nil, err
	}

	// 下载每个匹配的对象
	for _, objectName := range objects {
		data, err := DownloadFromMinIOToMemory(client, bucketName, objectName)
		if err != nil {
			log.Printf("Failed to download %s: %v", objectName, err)
			continue
		}
		result[objectName] = data
	}

	return result, nil
}

// UploadMinIO 上传文件到MinIO
func UploadMinIO(client *minio.Client, bucketName, objectName string, data []byte) error {
	// 检查bucket是否存在，不存在则创建
	exists, err := client.BucketExists(context.Background(), bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %v", err)
	}

	if !exists {
		err = client.MakeBucket(context.Background(), bucketName, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %v", err)
		}
		log.Printf("Bucket %s created successfully", bucketName)
	}

	// 上传文件
	reader := bytes.NewReader(data)
	_, err = client.PutObject(context.Background(), bucketName, objectName, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: getContentType(objectName),
	})
	if err != nil {
		return fmt.Errorf("failed to upload object: %v", err)
	}

	log.Printf("File %s uploaded successfully to bucket %s", objectName, bucketName)
	return nil
}

// getContentType 根据文件扩展名获取Content-Type
func getContentType(filename string) string {
	if strings.HasSuffix(strings.ToLower(filename), ".jpg") || strings.HasSuffix(strings.ToLower(filename), ".jpeg") {
		return "image/jpeg"
	}
	if strings.HasSuffix(strings.ToLower(filename), ".png") {
		return "image/png"
	}
	if strings.HasSuffix(strings.ToLower(filename), ".gif") {
		return "image/gif"
	}
	if strings.HasSuffix(strings.ToLower(filename), ".pdf") {
		return "application/pdf"
	}
	if strings.HasSuffix(strings.ToLower(filename), ".txt") {
		return "text/plain"
	}
	if strings.HasSuffix(strings.ToLower(filename), ".html") {
		return "text/html"
	}
	return "application/octet-stream"
}

// DeleteObject 删除MinIO中的对象
func DeleteObject(client *minio.Client, bucketName, objectName string) error {
	err := client.RemoveObject(context.Background(), bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object: %v", err)
	}
	log.Printf("Object %s deleted successfully from bucket %s", objectName, bucketName)
	return nil
}

// GetObjectInfo 获取对象信息
func GetObjectInfo(client *minio.Client, bucketName, objectName string) (*minio.ObjectInfo, error) {
	info, err := client.StatObject(context.Background(), bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object info: %v", err)
	}
	return &info, nil
}

// ListBuckets 列出所有bucket
func ListBuckets(client *minio.Client) ([]minio.BucketInfo, error) {
	buckets, err := client.ListBuckets(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to list buckets: %v", err)
	}
	return buckets, nil
}
