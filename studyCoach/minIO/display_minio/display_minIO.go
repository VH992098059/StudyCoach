package display_minio

import (
	"context"
	"github.com/minio/minio-go/v7"
	"log"
)

type MinIOInfo struct {
	Buckets     []BucketInfo `json:"buckets"`
	TotalBuckets int         `json:"total_buckets"`
	Status      string      `json:"status"`
}

type BucketInfo struct {
	Name         string `json:"name"`
	CreationDate string `json:"creation_date"`
	ObjectCount  int    `json:"object_count"`
}

// GetMinIOInfo 获取MinIO信息
func GetMinIOInfo(client *minio.Client) *MinIOInfo {
	info := &MinIOInfo{
		Status: "connected",
	}

	// 获取所有bucket
	buckets, err := client.ListBuckets(context.Background())
	if err != nil {
		log.Printf("Failed to list buckets: %v", err)
		info.Status = "error"
		return info
	}

	info.TotalBuckets = len(buckets)

	// 获取每个bucket的详细信息
	for _, bucket := range buckets {
		bucketInfo := BucketInfo{
			Name:         bucket.Name,
			CreationDate: bucket.CreationDate.Format("2006-01-02 15:04:05"),
		}

		// 计算bucket中的对象数量
		objectCount := 0
		objectCh := client.ListObjects(context.Background(), bucket.Name, minio.ListObjectsOptions{
			Recursive: true,
		})

		for range objectCh {
			objectCount++
		}

		bucketInfo.ObjectCount = objectCount
		info.Buckets = append(info.Buckets, bucketInfo)
	}

	return info
}

// GetBucketStats 获取特定bucket的统计信息
func GetBucketStats(client *minio.Client, bucketName string) map[string]interface{} {
	stats := make(map[string]interface{})

	objectCount := 0
	totalSize := int64(0)
	fileTypes := make(map[string]int)

	objectCh := client.ListObjects(context.Background(), bucketName, minio.ListObjectsOptions{
		Recursive: true,
	})

	for object := range objectCh {
		if object.Err != nil {
			log.Printf("Error listing object: %v", object.Err)
			continue
		}

		objectCount++
		totalSize += object.Size

		// 统计文件类型
		ext := getFileExtension(object.Key)
		fileTypes[ext]++
	}

	stats["object_count"] = objectCount
	stats["total_size"] = totalSize
	stats["file_types"] = fileTypes

	return stats
}

// getFileExtension 获取文件扩展名
func getFileExtension(filename string) string {
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			return filename[i:]
		}
	}
	return "unknown"
}
