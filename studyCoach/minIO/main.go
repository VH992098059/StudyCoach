package main

import (
	"fmt"
	"log"
	"studyCoach/studyCoach/minIO/config_minio"
	"studyCoach/studyCoach/minIO/minio_func"
)

func main() {
	config := config_minio.MinIOConfig{
		EndpointAddr:    "localhost:9000",
		AccessKeyID:     "minioadmin",
		SecretAccessKey: "minioadmin",
		UseSSL:          false,
		BucketName:      "images",
	}
	imagePath := "C:\\Users\\solid\\Pictures\\VPcGsmE-battlefield-wallpaper_waifu2x_noise2_scale_x2.0.png"
	io, err := minio_func.UploadMinIO(config, imagePath)
	if err != nil {
		log.Fatalf("图片上传错误：%v", err)
	}
	fmt.Printf("图片已成功上传！访问URL：%s\n", io)
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
