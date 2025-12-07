package test

import (
	"backend/studyCoach/minioFunc/config_minio"
	"backend/studyCoach/minioFunc/minio_func"
	"fmt"
	"log"
	"testing"
)

func TestMinIO(T *testing.T) {
	config := config_minio.MinIOConfig{
		EndpointAddr:    "localhost:9000",
		AccessKeyID:     "minioadmin",
		SecretAccessKey: "770880520",
		UseSSL:          false,
		BucketName:      "images",
	}
	imagePath := "C:\\Users\\solid\\Pictures\\VPcGsmE-battlefield-wallpaper_waifu2x_noise2_scale_x2.0.png"
	io, fileURL, err := minio_func.ResumableUploadFile(config, imagePath)

	if err != nil {
		log.Fatalf("图片上传错误：%v", err)
	}
	fmt.Printf("图片已成功上传！访问URL：%s\n文件上传信息：%s\n", fileURL, io.Location)

	fileToDownload := []string{"20251116-002514-VPcGsmE-battlefield-wallpaper_waifu2x_noise2_scale_x2.0.png"}
	downloadDir := "./my_downloads"

	downloadResults := minio_func.BatchResumableDownload(config, fileToDownload, downloadDir, 3)
	log.Println("开始批量下载...")
	for result := range downloadResults {
		if result.Error != nil {
			log.Printf("下载文件 %s 失败: %v", result.ObjectName, result.Error)
		} else {
			log.Printf("成功下载文件 %s 到 %s", result.ObjectName, result.FilePath)
		}
	}
	log.Println("所有下载任务已完成。")

	/*matchedFiles, err := minio_func.SearchObjectsMinIO(config, "halo")
	if err != nil {
		log.Printf("搜索失败：%v", err)
		return
	}
	fmt.Printf("找到 %d 个匹配的文件：\n", len(matchedFiles))
	for _, fileName := range matchedFiles {
		fmt.Printf("- %s\n", fileName)
	}
	// 搜索并下载到内存
	filesData, err := minio_func.DownloadFromMinIOByPattern(config, "halo")
	if err != nil {
		log.Printf("下载失败：%v", err)
		return
	}

	for fileName, data := range filesData {
		fileSuffix := config_minio.GetFilePrefix(fileName)
		fmt.Printf("文件：%s,大小：%d 字节\n", fileSuffix, len(data))
	}*/

}
