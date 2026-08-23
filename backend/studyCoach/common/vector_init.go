package common

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/milvus-io/milvus/client/v2/milvusclient"
	"github.com/qdrant/go-client/qdrant"
	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"
	"google.golang.org/grpc/keepalive"
)

// milvusDialOptions 覆盖 Milvus SDK 默认的激进 gRPC keepalive（每 5s 发 ping 且无 stream 也发），
// 避免服务端因 ping 过于频繁返回 GoAway "too_many_pings"。
// 注意：Milvus SDK 在 DialOptions 非空时会完全跳过其 DefaultGrpcOpts，
// 因此这里需把必要的默认项（block、connect backoff、MaxCallRecvMsgSize）一并保留。
var milvusDialOptions = []grpc.DialOption{
	grpc.WithBlock(),
	grpc.WithKeepaliveParams(keepalive.ClientParameters{
		Time:                5 * time.Minute, // >= gRPC 服务端默认 MinTime(5min)，避免 too_many_pings
		Timeout:             20 * time.Second,
		PermitWithoutStream: false, // 无活跃 stream 不发 ping，进一步降低 ping 频率
	}),
	grpc.WithConnectParams(grpc.ConnectParams{
		Backoff: backoff.Config{
			BaseDelay:  100 * time.Millisecond,
			Multiplier: 1.6,
			Jitter:     0.2,
			MaxDelay:   3 * time.Second,
		},
		MinConnectTimeout: 3 * time.Second,
	}),
	grpc.WithDefaultCallOptions(
		grpc.MaxCallRecvMsgSize(math.MaxInt32),
	),
}

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
	apiKey, _ := cfg.Get(ctx, "embeddingArk.apiKey")
	baseURL, _ := cfg.Get(ctx, "embeddingArk.baseURL")
	chatModel, _ := cfg.Get(ctx, "embeddingArk.model")
	dim := 2048 // doubao-embedding-vision-251215 默认输出 2048 维
	if v, err := cfg.Get(ctx, "embeddingArk.dim"); err == nil && v.Int() > 0 {
		dim = v.Int()
	}

	conf := &Config{
		VectorEngine:   engineStr,
		VectorDim:      dim,
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
			Address:     address.String(),
			Username:    username.String(),
			Password:    password.String(),
			DialOptions: milvusDialOptions,
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
