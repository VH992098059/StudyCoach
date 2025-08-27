package common

import (
	"github.com/elastic/go-elasticsearch/v8"
)

type Config struct {
	Client    *elasticsearch.Client
	IndexName string // es index name
	// embedding 时使用
	APIKey         string
	BaseURL        string
	EmbeddingModel string
	ChatModel      string
}

func (c *Config) Copy() *Config {
	return &Config{
		Client:    c.Client,
		IndexName: c.IndexName,
		// embedding 时使用
		APIKey:         c.APIKey,
		BaseURL:        c.BaseURL,
		EmbeddingModel: c.EmbeddingModel,
		ChatModel:      c.ChatModel,
	}
}
