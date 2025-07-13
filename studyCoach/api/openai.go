package api

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"github.com/cloudwego/eino/schema"
	"github.com/gin-gonic/gin"
	"io"
	"log"
	"net/http"
	"studyCoach/studyCoach/common"
	"studyCoach/studyCoach/configTool"
	"studyCoach/studyCoach/eino"
	"studyCoach/studyCoach/minIO/minio_func"
	"strings"
	"time"
)

type ChatRequest struct {
	Message string `json:"message"`
	UserId  string `json:"user_id"`
}

type ChatResponse struct {
	Response string `json:"response"`
	Error    string `json:"error,omitempty"`
}

type StreamResponse struct {
	Content string `json:"content"`
	Done    bool   `json:"done"`
	Error   string `json:"error,omitempty"`
}

// ChatAiModel 处理AI聊天请求
func ChatAiModel(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ChatResponse{
			Error: "Invalid request format",
		})
		return
	}

	if req.Message == "" {
		c.JSON(http.StatusBadRequest, ChatResponse{
			Error: "Message cannot be empty",
		})
		return
	}

	// 初始化配置
	config, err := configTool.InitConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ChatResponse{
			Error: fmt.Sprintf("Failed to initialize config: %v", err),
		})
		return
	}

	// 设置响应头为流式传输
	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Content-Type")

	// 创建上下文
	ctx := context.Background()

	// 网络搜索功能
	searchTool, err := eino.NewTool(ctx)
	if err != nil {
		log.Printf("Failed to create search tool: %v", err)
		// 继续执行，不中断流程
	}

	// 检查是否需要搜索
	needSearch := strings.Contains(strings.ToLower(req.Message), "搜索") ||
		strings.Contains(strings.ToLower(req.Message), "search") ||
		strings.Contains(strings.ToLower(req.Message), "查找") ||
		strings.Contains(strings.ToLower(req.Message), "最新")

	var searchResults string
	if needSearch && searchTool != nil {
		// 执行搜索
		searchInput := map[string]any{
			"query": req.Message,
		}
		result, err := searchTool.InvokeableInvoke(ctx, searchInput)
		if err != nil {
			log.Printf("Search failed: %v", err)
		} else {
			if resultStr, ok := result.(string); ok {
				searchResults = resultStr
			}
		}
	}

	// ES检索功能
	retriever, err := eino.NewRetriever(ctx, config)
	if err != nil {
		log.Printf("Failed to create retriever: %v", err)
	}

	var retrievedDocs []*schema.Document
	if retriever != nil {
		retrievedDocs, err = retriever.Retrieve(ctx, req.Message)
		if err != nil {
			log.Printf("Retrieval failed: %v", err)
		}
	}

	// 构建聊天历史
	chatHistory := []*schema.Message{
		{
			Role:    schema.User,
			Content: req.Message,
		},
	}

	// 构建输入参数
	input := map[string]any{
		"user_input":    req.Message,
		"chat_history":  chatHistory,
		"user_id":       req.UserId,
		"search_results": searchResults,
		"retrieved_docs": retrievedDocs,
	}

	// 创建编排图
	graph, err := eino.StudyCoachFor(ctx, config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ChatResponse{
			Error: fmt.Sprintf("Failed to create graph: %v", err),
		})
		return
	}

	// 执行流式生成
	stream, err := graph.Stream(ctx, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ChatResponse{
			Error: fmt.Sprintf("Failed to start stream: %v", err),
		})
		return
	}

	// 处理流式响应
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, ChatResponse{
			Error: "Streaming not supported",
		})
		return
	}

	for {
		select {
		case chunk, ok := <-stream:
			if !ok {
				// 流结束
				response := StreamResponse{
					Content: "",
					Done:    true,
				}
				data, _ := json.Marshal(response)
				fmt.Fprintf(c.Writer, "data: %s\n\n", data)
				flusher.Flush()
				return
			}

			// 处理流式数据
			if chunk.Error != nil {
				response := StreamResponse{
					Error: chunk.Error.Error(),
					Done:  true,
				}
				data, _ := json.Marshal(response)
				fmt.Fprintf(c.Writer, "data: %s\n\n", data)
				flusher.Flush()
				return
			}

			// 提取内容
			var content string
			if chunk.Output != nil {
				if str, ok := chunk.Output.(string); ok {
					content = str
				} else if msg, ok := chunk.Output.(*schema.Message); ok {
					content = msg.Content
				}
			}

			if content != "" {
				response := StreamResponse{
					Content: content,
					Done:    false,
				}
				data, _ := json.Marshal(response)
				fmt.Fprintf(c.Writer, "data: %s\n\n", data)
				flusher.Flush()
			}

		case <-ctx.Done():
			return
		case <-time.After(30 * time.Second):
			// 超时处理
			response := StreamResponse{
				Error: "Request timeout",
				Done:  true,
			}
			data, _ := json.Marshal(response)
			fmt.Fprintf(c.Writer, "data: %s\n\n", data)
			flusher.Flush()
			return
		}
	}
}

// UploadFile 处理文件上传
func UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to get file from request",
		})
		return
	}
	defer file.Close()

	// 读取文件内容
	fileContent, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read file content",
		})
		return
	}

	// 上传到MinIO
	config, err := configTool.InitConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize config",
		})
		return
	}

	filePath := fmt.Sprintf("uploads/%s", header.Filename)
	err = minio_func.UploadMinIO(config.MinIOClient, "study-coach", filePath, fileContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to upload file: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "File uploaded successfully",
		"file_path": filePath,
	})
}

// GetChatHistory 获取聊天历史
func GetChatHistory(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id is required",
		})
		return
	}

	// 这里应该从数据库或缓存中获取聊天历史
	// 暂时返回空历史
	c.JSON(http.StatusOK, gin.H{
		"chat_history": []*schema.Message{},
	})
}

// HealthCheck 健康检查
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
		"version":   "1.0.0",
	})
}

// SearchDocuments 搜索文档
func SearchDocuments(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "query parameter 'q' is required",
		})
		return
	}

	// 初始化配置
	config, err := configTool.InitConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize config",
		})
		return
	}

	// 创建检索器
	ctx := context.Background()
	retriever, err := eino.NewRetriever(ctx, config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create retriever",
		})
		return
	}

	// 执行搜索
	docs, err := retriever.Retrieve(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Search failed: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"documents": docs,
		"count":     len(docs),
	})
}

// ProcessDocument 处理文档索引
func ProcessDocument(c *gin.Context) {
	var req struct {
		URL      string `json:"url"`
		Content  string `json:"content"`
		Title    string `json:"title"`
		Metadata map[string]interface{} `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	// 初始化配置
	config, err := configTool.InitConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to initialize config",
		})
		return
	}

	// 创建文档
	doc := &schema.Document{
		Content:  req.Content,
		Metadata: req.Metadata,
	}

	if req.URL != "" {
		doc.ID = req.URL
	}

	// 创建索引器
	ctx := context.Background()
	indexer, err := eino.NewIndexer(ctx, config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create indexer",
		})
		return
	}

	// 索引文档
	err = indexer.Index(ctx, []*schema.Document{doc})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to index document: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Document indexed successfully",
		"doc_id":  doc.ID,
	})
}

// StreamChat 处理流式聊天（SSE）
func StreamChat(c *gin.Context) {
	// 设置SSE响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Headers", "Content-Type")

	// 获取请求参数
	message := c.Query("message")
	userID := c.Query("user_id")

	if message == "" {
		fmt.Fprintf(c.Writer, "event: error\ndata: {\"error\": \"Message cannot be empty\"}\n\n")
		c.Writer.(http.Flusher).Flush()
		return
	}

	// 模拟流式响应
	responses := []string{
		"正在分析您的问题...",
		"搜索相关资料...",
		"生成回答...",
		"这是一个很好的问题！",
		"根据我的分析，建议您...",
	}

	for i, resp := range responses {
		fmt.Fprintf(c.Writer, "event: message\ndata: {\"content\": \"%s\", \"done\": %t}\n\n", resp, i == len(responses)-1)
		c.Writer.(http.Flusher).Flush()
		time.Sleep(500 * time.Millisecond)
	}

	fmt.Fprintf(c.Writer, "event: done\ndata: {\"done\": true}\n\n")
	c.Writer.(http.Flusher).Flush()
}

// GetSystemInfo 获取系统信息
func GetSystemInfo(c *gin.Context) {
	config, err := configTool.InitConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get system info",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"elasticsearch": gin.H{
			"index": config.IndexName,
			"status": "connected",
		},
		"model": gin.H{
			"type":    config.ModelType,
			"version": "latest",
		},
		"features": []string{
			"chat",
			"search",
			"document_processing",
			"file_upload",
		},
	})
}
