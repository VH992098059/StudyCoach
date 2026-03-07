package common

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/milvus-io/milvus/client/v2/milvusclient"
	"github.com/qdrant/go-client/qdrant"
)

// BuildVectorConfig 根据 vectorEngine 配置构建 Config。默认 es。
// 配置项：vectorEngine(es|qdrant|milvus)、es.*、qdrant.*、milvus.*
func BuildVectorConfig(ctx context.Context) (*Config, error) {
	cfg := g.Cfg()
	engine, _ := cfg.Get(ctx, "vectorEngine")
	engineStr := engine.String()
	if engineStr == "" {
		engineStr = VectorEngineES
	}

	// 获取 embedding 配置（通用）
	apiKey, _ := cfg.Get(ctx, "embedding.apiKey")
	baseURL, _ := cfg.Get(ctx, "embedding.baseURL")
	chatModel, _ := cfg.Get(ctx, "embedding.model")

	conf := &Config{
		VectorEngine:   engineStr,
		APIKey:         apiKey.String(),
		BaseURL:        baseURL.String(),
		EmbeddingModel: chatModel.String(),
		ChatModel:      chatModel.String(),
	}

	switch engineStr {
	case VectorEngineES:
		address, err := cfg.Get(ctx, "es.address")
		if err != nil || address.String() == "" {
			return nil, fmt.Errorf("config missing: es.address")
		}
		indexName, _ := cfg.Get(ctx, "es.indexName")
		if indexName.String() == "" {
			indexName, _ = cfg.Get(ctx, "es.indexName")
		}
		client, err := elasticsearch.NewClient(elasticsearch.Config{
			Addresses: []string{address.String()},
		})
		if err != nil {
			return nil, fmt.Errorf("elasticsearch client init failed: %w", err)
		}
		conf.Client = client
		conf.IndexName = indexName.String()
		if conf.IndexName == "" {
			conf.IndexName = "study"
		}
		return conf, nil

	case VectorEngineQdrant:
		address, err := cfg.Get(ctx, "qdrant.address")
		if err != nil || address.String() == "" {
			return nil, fmt.Errorf("config missing: qdrant.address when vectorEngine=qdrant")
		}
		collection, _ := cfg.Get(ctx, "qdrant.collection")
		if collection.String() == "" {
			collection, _ = cfg.Get(ctx, "es.indexName")
		}
		collectionStr := collection.String()
		if collectionStr == "" {
			collectionStr = "study"
		}
		// qdrant go-client 使用 gRPC，address 格式如 localhost:6334
		host, port := parseHostPort(address.String(), "localhost", 6334)
		qdrantClient, err := qdrant.NewClient(&qdrant.Config{
			Host: host,
			Port: port,
		})
		if err != nil {
			return nil, fmt.Errorf("qdrant client init failed: %w", err)
		}
		conf.QdrantClient = qdrantClient
		conf.IndexName = collectionStr
		return conf, nil

	case VectorEngineMilvus:
		address, err := cfg.Get(ctx, "milvus.address")
		if err != nil || address.String() == "" {
			return nil, fmt.Errorf("config missing: milvus.address when vectorEngine=milvus")
		}
		collection, _ := cfg.Get(ctx, "milvus.collection")
		if collection.String() == "" {
			collection, _ = cfg.Get(ctx, "es.indexName")
		}
		collectionStr := collection.String()
		if collectionStr == "" {
			collectionStr = "study"
		}
		username, _ := cfg.Get(ctx, "milvus.username")
		password, _ := cfg.Get(ctx, "milvus.password")
		milvusConfig := &milvusclient.ClientConfig{
			Address:  address.String(),
			Username: username.String(),
			Password: password.String(),
		}
		milvusClient, err := milvusclient.New(ctx, milvusConfig)
		if err != nil {
			return nil, fmt.Errorf("milvus client init failed: %w", err)
		}
		conf.MilvusClient = milvusClient
		conf.MilvusConfig = milvusConfig
		conf.IndexName = collectionStr
		return conf, nil

	default:
		return nil, fmt.Errorf("unsupported vectorEngine: %s", engineStr)
	}
}

func parseHostPort(addr, defaultHost string, defaultPort int) (string, int) {
	if addr == "" {
		return defaultHost, defaultPort
	}
	parts := strings.SplitN(addr, ":", 2)
	if len(parts) == 1 {
		return parts[0], defaultPort
	}
	port, err := strconv.Atoi(parts[1])
	if err != nil {
		return parts[0], defaultPort
	}
	return parts[0], port
}
