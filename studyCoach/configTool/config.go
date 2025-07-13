package configTool

import (
	"context"
	"fmt"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/joho/godotenv"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"log"
	"os"
	"studyCoach/studyCoach/common"
)

// Config 配置结构体
type Config struct {
	Client        *elasticsearch.Client
	IndexName     string
	ApiKey        string
	BaseURL       string
	Model         string
	ModelType     string
	MinIOClient   *minio.Client
	MinIOBucket   string
	MinIOEndpoint string
}

// InitConfig 初始化配置
func InitConfig() (*Config, error) {
	// 加载.env文件
	err := godotenv.Load(".env")
	if err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// 初始化Elasticsearch客户端
	esClient, err := initElasticsearch()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Elasticsearch: %w", err)
	}

	// 初始化MinIO客户端
	minioClient, err := initMinIO()
	if err != nil {
		log.Printf("Warning: failed to initialize MinIO: %v", err)
		// MinIO不是必需的，可以继续
	}

	// 创建配置对象
	config := &Config{
		Client:        esClient,
		IndexName:     getEnv("ES_INDEX_NAME", "study_coach"),
		ApiKey:        getEnv("OPENAI_API_KEY", ""),
		BaseURL:       getEnv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
		Model:         getEnv("OPENAI_MODEL", "gpt-3.5-turbo"),
		ModelType:     getEnv("MODEL_TYPE", "openai"),
		MinIOClient:   minioClient,
		MinIOBucket:   getEnv("MINIO_BUCKET", "study-coach"),
		MinIOEndpoint: getEnv("MINIO_ENDPOINT", "localhost:9000"),
	}

	// 验证必需的配置
	if config.ApiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is required")
	}

	// 检查并创建索引
	err = common.CheckAndCreateIndex(esClient, config.IndexName)
	if err != nil {
		log.Printf("Warning: failed to check/create index: %v", err)
	}

	return config, nil
}

// initElasticsearch 初始化Elasticsearch客户端
func initElasticsearch() (*elasticsearch.Client, error) {
	esURL := getEnv("ELASTICSEARCH_URL", "http://localhost:9200")
	esUsername := getEnv("ELASTICSEARCH_USERNAME", "")
	esPassword := getEnv("ELASTICSEARCH_PASSWORD", "")

	config := elasticsearch.Config{
		Addresses: []string{esURL},
	}

	// 如果提供了用户名和密码，则使用基本认证
	if esUsername != "" && esPassword != "" {
		config.Username = esUsername
		config.Password = esPassword
	}

	client, err := elasticsearch.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Elasticsearch client: %w", err)
	}

	// 测试连接
	res, err := client.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Elasticsearch: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		return nil, fmt.Errorf("Elasticsearch returned error: %s", res.Status())
	}

	log.Printf("Successfully connected to Elasticsearch at %s", esURL)
	return client, nil
}

// initMinIO 初始化MinIO客户端
func initMinIO() (*minio.Client, error) {
	endpoint := getEnv("MINIO_ENDPOINT", "localhost:9000")
	accessKey := getEnv("MINIO_ACCESS_KEY", "minioadmin")
	secretKey := getEnv("MINIO_SECRET_KEY", "minioadmin")
	useSSL := getEnv("MINIO_USE_SSL", "false") == "true"

	// 创建MinIO客户端
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	// 测试连接
	ctx := context.Background()
	_, err = minioClient.ListBuckets(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MinIO: %w", err)
	}

	log.Printf("Successfully connected to MinIO at %s", endpoint)
	return minioClient, nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// ValidateConfig 验证配置
func (c *Config) ValidateConfig() error {
	if c.Client == nil {
		return fmt.Errorf("Elasticsearch client is nil")
	}

	if c.IndexName == "" {
		return fmt.Errorf("index name is empty")
	}

	if c.ApiKey == "" {
		return fmt.Errorf("API key is empty")
	}

	if c.BaseURL == "" {
		return fmt.Errorf("base URL is empty")
	}

	if c.Model == "" {
		return fmt.Errorf("model is empty")
	}

	return nil
}

// GetModelConfig 获取模型配置
func (c *Config) GetModelConfig() map[string]string {
	return map[string]string{
		"api_key":   c.ApiKey,
		"base_url":  c.BaseURL,
		"model":     c.Model,
		"model_type": c.ModelType,
	}
}

// GetESConfig 获取Elasticsearch配置
func (c *Config) GetESConfig() map[string]interface{} {
	return map[string]interface{}{
		"client":     c.Client,
		"index_name": c.IndexName,
	}
}

// GetMinIOConfig 获取MinIO配置
func (c *Config) GetMinIOConfig() map[string]interface{} {
	return map[string]interface{}{
		"client":   c.MinIOClient,
		"bucket":   c.MinIOBucket,
		"endpoint": c.MinIOEndpoint,
	}
}
