package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"studyCoach/studyCoach/minIO/config_minio"
	"studyCoach/studyCoach/minIO/display_minio"
	"studyCoach/studyCoach/minIO/minio_func"
)

func main() {
	// 创建MinIO客户端
	minioClient, err := config_minio.CreateMinio()
	if err != nil {
		log.Fatalf("Failed to create MinIO client: %v", err)
	}

	// 创建Gin路由
	r := gin.Default()

	// 设置CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 图片上传接口
	r.POST("/upload", func(c *gin.Context) {
		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Failed to get file from request",
			})
			return
		}
		defer file.Close()

		// 读取文件内容
		fileContent := make([]byte, header.Size)
		_, err = file.Read(fileContent)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to read file content",
			})
			return
		}

		// 上传到MinIO
		bucketName := "images"
		objectName := fmt.Sprintf("uploads/%s", header.Filename)
		err = minio_func.UploadMinIO(minioClient, bucketName, objectName, fileContent)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to upload file: %v", err),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":     "File uploaded successfully",
			"bucket":      bucketName,
			"object_name": objectName,
			"file_size":   header.Size,
		})
	})

	// 图片列表接口
	r.GET("/images", func(c *gin.Context) {
		bucketName := "images"
		prefix := c.Query("prefix")
		if prefix == "" {
			prefix = "uploads/"
		}

		objects, err := minio_func.SearchObjectsMinIO(minioClient, bucketName, prefix)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to list objects: %v", err),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"objects": objects,
			"count":   len(objects),
		})
	})

	// 图片下载接口
	r.GET("/download/:bucket/:object", func(c *gin.Context) {
		bucketName := c.Param("bucket")
		objectName := c.Param("object")

		data, err := minio_func.DownloadFromMinIOToMemory(minioClient, bucketName, objectName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to download file: %v", err),
			})
			return
		}

		// 设置响应头
		c.Header("Content-Type", "application/octet-stream")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", objectName))
		c.Data(http.StatusOK, "application/octet-stream", data)
	})

	// 显示MinIO信息
	r.GET("/info", func(c *gin.Context) {
		info := display_minio.GetMinIOInfo(minioClient)
		c.JSON(http.StatusOK, info)
	})

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"service": "MinIO API",
		})
	})

	log.Println("MinIO API server starting on :8081")
	log.Fatal(r.Run(":8081"))
}
