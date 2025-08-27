package display_minio

import (
	"backend/studyCoach/minIO/config_minio"
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func ListImages(config config_minio.MinIOConfig, bucketName string, w http.ResponseWriter) {
	minioClient, err := minio.New(config.EndpointAddr, &minio.Options{
		Creds: credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
	})
	if err != nil {
		log.Fatalf("Minio客户端初始化失败：%v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	objects := minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Recursive: true,
	})
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintln(w, `<html><body><h2>存储桶中的图片:</h2><ul>`)
	for object := range objects {
		if object.Err != nil {
			log.Printf("列出对象错误: %v", object.Err)
			continue
		}
		// 为每个图片生成链接
		fmt.Fprintf(w, `<li><a href="/images?name=%s">%s</a></li>`, object.Key, object.Key)
	}
	fmt.Fprintln(w, `</ul></body></html>`)
}
