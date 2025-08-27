package minio_func

import (
	"backend/studyCoach/minIO/config_minio"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// 全局客户端池，复用连接
var (
	clientPool = sync.Map{} // key: config hash, value: *minio.Client
	clientMu   sync.Mutex
)

// SearchObjectsMinIO 根据模式搜索MinIO中的对象
func SearchObjectsMinIO(config config_minio.MinIOConfig, pattern string) ([]string, error) {
	//创建连接minio客户端
	client, err := config_minio.CreateMinio(config)
	if err != nil {
		return nil, err
	}
	//创建ctx
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	//查询存储桶是否存在
	exists, err := client.BucketExists(ctx, config.BucketName)
	if err != nil {
		return nil, fmt.Errorf("存储桶查询失败：%w", err)
	}
	if !exists {
		return nil, fmt.Errorf("存储桶 %s 不存在", config.BucketName)
	}
	// 列出存储桶中的所有对象
	objectCh := client.ListObjects(ctx, config.BucketName, minio.ListObjectsOptions{
		Recursive: true,
	})
	var matchedObjects []string
	for object := range objectCh {
		if object.Err != nil {
			return nil, fmt.Errorf("列出对象失败：%w", object.Err)
		}
		// 检查对象名是否包含指定的模式
		if strings.Contains(object.Key, pattern) {
			matchedObjects = append(matchedObjects, object.Key)
		}
	}

	return matchedObjects, nil
}

// DownloadFromMinIOToMemory 从minio图片下载到内存
func DownloadFromMinIOToMemory(config config_minio.MinIOConfig, objectName string) ([]byte, error) {
	//创建连接minio客户端
	client, err := config_minio.CreateMinio(config)
	if err != nil {
		return nil, err
	}
	//创建ctx
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	object, err := client.GetObject(ctx, config.BucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("获取对象失败：%w", err)
	}
	defer object.Close()
	data, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("读取对象数据失败：%w", err)
	}
	fmt.Printf("文件读取到内存成功：%s，大小：%d 字节\n", objectName, len(data))
	return data, nil
}

// DownloadFromMinIOByPattern 通过模糊匹配下载文件到内存
func DownloadFromMinIOByPattern(config config_minio.MinIOConfig, pattern string) (map[string][]byte, error) {
	matchedObjects, err := SearchObjectsMinIO(config, pattern)
	if err != nil {
		return nil, err
	}
	if len(matchedObjects) == 0 {
		return nil, fmt.Errorf("未找到匹配模式 '%s' 的文件", pattern)
	}
	if len(matchedObjects) == 1 {
		data, err := DownloadFromMinIOToMemory(config, matchedObjects[0])
		if err != nil {
			return nil, err
		}
		return map[string][]byte{matchedObjects[0]: data}, nil
	}
	// 多个文件时使用并发
	type downloadResult struct {
		objectName string
		data       []byte
		err        error
	}
	maxWorkers := len(matchedObjects)
	if maxWorkers > 5 {
		maxWorkers = 5
	}
	tasks := make(chan string, len(matchedObjects))
	results := make(chan downloadResult, len(matchedObjects))

	//启动协程
	var wg sync.WaitGroup
	for i := 0; i < maxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for objectName := range tasks {
				data, err := DownloadFromMinIOToMemory(config, objectName)
				results <- downloadResult{
					objectName: objectName,
					data:       data,
					err:        err,
				}
			}
		}()
	}

	//发送任务
	go func() {
		defer close(tasks)
		for _, objectName := range matchedObjects {
			tasks <- objectName
		}
	}()

	//收集结果
	result := make(map[string][]byte)
	for res := range results {
		if res.err != nil {
			fmt.Printf("下载文件 %s 失败：%v\n", res.objectName, res.err) // 保持原有日志格式
			continue
		}
		result[res.objectName] = res.data
	}
	return result, nil
}

// UploadMinIO 上传文件到minio
func UploadMinIO(config config_minio.MinIOConfig, imagePath string) (string, error) {

	client, err := minio.New(config.EndpointAddr, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.UseSSL,
	})
	if err != nil {
		return "", fmt.Errorf("MinIO客户端创建失败：%w", err)
	}
	//查询并创建存储桶
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	exists, err := client.BucketExists(ctx, config.BucketName)
	if err != nil {
		return "", fmt.Errorf("存储桶查询失败：%w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, config.BucketName, minio.MakeBucketOptions{}); err != nil {
			return "", fmt.Errorf("存储桶创建失败：%w", err)
		}
	}
	objectName := generateObjectName(filepath.Base(imagePath))
	contentType := getContentType(filepath.Ext(imagePath))

	//上传文件
	file, err := os.Open(imagePath)
	if err != nil {
		return "", fmt.Errorf("文件打开失败：%w", err)
	}
	defer file.Close()
	fileInfo, err := file.Stat()
	if err != nil {
		return "", fmt.Errorf("文件信息获取失败：%w", err)
	}

	// 上传文件到MinIO
	uploadInfo, err := client.PutObject(
		ctx,
		config.BucketName,
		objectName,
		file,
		fileInfo.Size(),
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return "", fmt.Errorf("文件上传失败：%w", err)
	}

	// 返回文件的访问URL
	fileURL := fmt.Sprintf("http://%s/%s/%s", config.EndpointAddr, config.BucketName, objectName)
	fmt.Printf("文件上传成功: %s, ETag: %s\n", uploadInfo.Key, uploadInfo.ETag)
	return fileURL, nil
}

func generateObjectName(filename string) string {
	ext := filepath.Ext(filename)
	name := time.Now().Format("20060102-150405") + "-" + filename[:len(filename)-len(ext)]
	return fmt.Sprintf("%s%s", name, ext)
}
func getContentType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		{
			return "image/jpeg"
		}
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}
