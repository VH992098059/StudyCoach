package configTool

import "github.com/elastic/go-elasticsearch/v8"

type Config struct {
	Client    *elasticsearch.Client
	IndexName string
	//embedding
	ApiKey  string
	BaseURL string
	Model   string
	//model
	ChatModel string
}
