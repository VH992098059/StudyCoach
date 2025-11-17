package minio_func

import (
	"backend/studyCoach/minIO/config_minio"
	"context"
	"fmt"
	"io"
	"log"
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
func SearchObjectsMinIO(ctx context.Context, config config_minio.MinIOConfig, pattern string) ([]string, error) {
	//创建连接minio客户端
	client, err := config_minio.CreateMinio(config)
	if err != nil {
		return nil, err
	}
	//查询存储桶是否存在
	exists, err := client.BucketExists(ctx, config.BucketName)
	if err != nil {
		return nil, fmt.Errorf("存储桶查询失败：%w", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, config.BucketName, minio.MakeBucketOptions{Region: "china"})
		if err != nil {
			return nil, fmt.Errorf("存储桶 %s 创建失败", config.BucketName)
		}
		log.Printf("存储桶 %s 创建成功", config.BucketName)
	} else {
		log.Printf("存储桶 %s 已存在", config.BucketName)
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
func DownloadFromMinIOToMemory(ctx context.Context, config config_minio.MinIOConfig, objectName string) ([]byte, error) {
	//创建连接minio客户端
	client, err := config_minio.CreateMinio(config)
	if err != nil {
		return nil, err
	}
	object, err := client.GetObject(ctx, config.BucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("获取对象失败：%w", err)
	}
	defer object.Close()
	//读取文件
	data, err := io.ReadAll(object)
	if err != nil {
		return nil, fmt.Errorf("读取对象数据失败：%w", err)
	}
	fmt.Printf("文件读取到内存成功：%s，大小：%d 字节\n", objectName, len(data))
	return data, nil
}

// DownloadFromMinIOByPattern 通过模糊匹配下载文件到内存
func DownloadFromMinIOByPattern(ctx context.Context, config config_minio.MinIOConfig, pattern string) (map[string][]byte, error) {
	matchedObjects, err := SearchObjectsMinIO(ctx, config, pattern)
	if err != nil {
		return nil, err
	}
	if len(matchedObjects) == 0 {
		return nil, fmt.Errorf("未找到匹配模式 '%s' 的文件", pattern)
	}
	if len(matchedObjects) == 1 {
		data, err := DownloadFromMinIOToMemory(ctx, config, matchedObjects[0])
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
				data, err := DownloadFromMinIOToMemory(ctx, config, objectName)
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
	contentType := GetContentType(filepath.Ext(imagePath))

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

func GetContentType(ext string) string {
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

// ResumableUploadFile 断点上传
func ResumableUploadFile(config config_minio.MinIOConfig, filePath string) (minio.UploadInfo, string, error) {
	objectName := generateObjectName(filepath.Base(filePath))
	log.Println(objectName)
	createMinio, err := config_minio.CreateMinio(config)
	if err != nil {
		return minio.UploadInfo{}, "", err
	}
	ctx := context.Background()
	exists, err := createMinio.BucketExists(ctx, config.BucketName)
	if err != nil {
		return minio.UploadInfo{}, "", err
	}
	if !exists {
		err = createMinio.MakeBucket(ctx, config.BucketName, minio.MakeBucketOptions{})
		if err != nil {
			return minio.UploadInfo{}, "", err
		}
		log.Printf("创建成功： %s\n", config.BucketName)
	}
	object, err := createMinio.FPutObject(ctx, config.BucketName, objectName, filePath, minio.PutObjectOptions{})
	if err != nil {
		return minio.UploadInfo{}, "", err
	}
	log.Printf("上传成功 %s 大小为 %d\n", objectName, object.Size)
	fileURL := fmt.Sprintf("http://%s/%s/%s", config.EndpointAddr, config.BucketName, objectName)
	return object, fileURL, nil
}

// ResumableDownloadFile 从MinIO下载文件，如果下载中断则恢复
// 它将下载的文件保存到指定的本地`filePath`
func ResumableDownloadFile(config config_minio.MinIOConfig, bucketName, objectName, filePath string) error {
	//创建MinIO客户端
	client, err := config_minio.CreateMinio(config)
	if err != nil {
		return fmt.Errorf("创建MinIO客户端失败: %w", err)
	}

	//定义临时下载文件的路径
	tempFilePath := filePath + ".tmp"

	//检查现有临时文件的大小以确定下载的起点
	file, err := os.OpenFile(tempFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("打开临时文件失败: %w", err)
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return fmt.Errorf("获取临时文件状态失败: %w", err)
	}
	downloadedSize := stat.Size()

	//获取MinIO中对象的总大小，看是否需要下载任何东西
	objInfo, err := client.StatObject(context.Background(), bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return fmt.Errorf("获取对象状态失败: %w", err)
	}
	totalSize := objInfo.Size

	if downloadedSize >= totalSize {
		log.Printf("文件 %s 已完全下载。", filePath)
		// 如果临时文件是完整的，则重命名它。
		if err := os.Rename(tempFilePath, filePath); err != nil {
			return fmt.Errorf("重命名已完成的临时文件失败: %w", err)
		}
		return nil
	}

	log.Printf("从字节 %d 处恢复下载 %s", downloadedSize, objectName)

	//从已下载的大小开始获取对象流。
	opts := minio.GetObjectOptions{}
	if err := opts.SetRange(downloadedSize, totalSize-1); err != nil {
		return fmt.Errorf("为下载设置范围失败: %w", err)
	}

	object, err := client.GetObject(context.Background(), bucketName, objectName, opts)
	if err != nil {
		return fmt.Errorf("获取带范围的对象失败: %w", err)
	}
	defer object.Close()

	//将下载的数据追加到临时文件。
	written, err := io.Copy(file, object)
	if err != nil {
		return fmt.Errorf("写入临时文件失败: %w", err)
	}

	//验证最终大小并重命名文件。
	if downloadedSize+written != totalSize {
		return fmt.Errorf("下载失败：预期大小 %d，但得到 %d", totalSize, downloadedSize+written)
	}

	//在重命名之前关闭文件
	file.Close()

	if err := os.Rename(tempFilePath, filePath); err != nil {
		return fmt.Errorf("将临时文件重命名为最终目标失败: %w", err)
	}

	log.Printf("成功下载并保存了 %s", filePath)
	return nil
}

// BatchResumableDownloadResult 包含单个文件批量下载的结果
type BatchResumableDownloadResult struct {
	ObjectName string // MinIO中的对象名
	FilePath   string // 保存到的本地路径
	Error      error  // 如果下载失败，记录错误信息
}

// BatchResumableDownload 并发地批量下载文件，并支持断点续传
// objectNames 是要下载的文件名列表
// localDir 是要保存到的本地目录
// maxConcurrency 是最大并发下载数
func BatchResumableDownload(config config_minio.MinIOConfig, objectNames []string, localDir string, maxConcurrency int) <-chan BatchResumableDownloadResult {
	results := make(chan BatchResumableDownloadResult, len(objectNames))
	tasks := make(chan string, len(objectNames))

	if err := os.MkdirAll(localDir, 0755); err != nil {
		go func() {
			defer close(results)
			results <- BatchResumableDownloadResult{
				Error: fmt.Errorf("创建本地目录 %s 失败: %w", localDir, err),
			}
		}()
		return results
	}

	var wg sync.WaitGroup

	for i := 0; i < maxConcurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for objectName := range tasks {
				localFilePath := filepath.Join(localDir, objectName)

				//传入 bucketName
				err := ResumableDownloadFile(config, config.BucketName, objectName, localFilePath)

				results <- BatchResumableDownloadResult{
					ObjectName: objectName,
					FilePath:   localFilePath,
					Error:      err,
				}
			}
		}()
	}

	go func() {
		for _, name := range objectNames {
			tasks <- name
		}
		close(tasks)
	}()

	go func() {
		wg.Wait()
		close(results)
	}()

	return results
}

// SaveMarkdown 存储md文件
func SaveMarkdown(ctx context.Context, config config_minio.MinIOConfig) (result string, err error) {
	//创建连接minio客户端
	client, err := config_minio.CreateMinio(config)
	if err != nil {
		return "", err
	}
	//查询存储桶是否存在
	exists, err := client.BucketExists(ctx, config.BucketName)
	if err != nil {
		return "", fmt.Errorf("存储桶查询失败：%w", err)
	}
	if !exists {
		err = client.MakeBucket(ctx, config.BucketName, minio.MakeBucketOptions{Region: "china"})
		if err != nil {
			return "", fmt.Errorf("存储桶 %s 创建失败", config.BucketName)
		}
		log.Printf("存储桶 %s 创建成功", config.BucketName)
	} else {
		log.Printf("存储桶 %s 已存在", config.BucketName)
	}

	return
}
