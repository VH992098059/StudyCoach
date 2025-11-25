package common

import (
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/qdrant/go-client/qdrant"
)

type Config struct {
	Client       *elasticsearch.Client
	QdrantClient *qdrant.Client // Qdrant 客户端
	IndexName    string         // es index name
	// embedding 时使用
	APIKey         string
	BaseURL        string
	EmbeddingModel string
	ChatModel      string
}

func (c *Config) Copy() *Config {
	return &Config{
		Client:       c.Client,
		QdrantClient: c.QdrantClient,
		IndexName:    c.IndexName,
		// embedding 时使用
		APIKey:         c.APIKey,
		BaseURL:        c.BaseURL,
		EmbeddingModel: c.EmbeddingModel,
		ChatModel:      c.ChatModel,
	}
}
