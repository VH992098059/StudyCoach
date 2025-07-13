package main

import (
	"log"
	"net/http"
	"studyCoach/studyCoach/api"
	"studyCoach/studyCoach/configTool"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	config, err := configTool.InitConfig()
	if err != nil {
		log.Fatalf("Failed to initialize config: %v", err)
	}

	// 验证配置
	if err := config.ValidateConfig(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// 创建Gin路由器
	r := gin.Default()

	// 设置CORS中间件
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// 健康检查
	r.GET("/health", api.HealthCheck)

	// 系统信息
	r.GET("/info", api.GetSystemInfo)

	// AI聊天相关路由
	chatGroup := r.Group("/api/v1/chat")
	{
		chatGroup.POST("/message", api.ChatAiModel)           // 普通聊天
		chatGroup.GET("/stream", api.StreamChat)             // 流式聊天（SSE）
		chatGroup.GET("/history", api.GetChatHistory)        // 获取聊天历史
	}

	// 文档相关路由
	docGroup := r.Group("/api/v1/documents")
	{
		docGroup.GET("/search", api.SearchDocuments)         // 搜索文档
		docGroup.POST("/process", api.ProcessDocument)       // 处理文档索引
	}

	// 文件上传路由
	fileGroup := r.Group("/api/v1/files")
	{
		fileGroup.POST("/upload", api.UploadFile)            // 文件上传
	}

	// 静态文件服务（如果需要）
	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	// 根路径重定向到健康检查
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/health")
	})

	// 启动服务器
	port := ":8080"
	log.Printf("StudyCoach server starting on port %s", port)
	log.Printf("Health check: http://localhost%s/health", port)
	log.Printf("API documentation: http://localhost%s/info", port)

	if err := r.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
