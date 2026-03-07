package common

import (
	"context"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/schema"
	"github.com/milvus-io/milvus/client/v2/milvusclient"
)

// milvusCollectionExists 检查 Milvus collection 是否存在
func (c *Config) milvusCollectionExists(ctx context.Context) (bool, error) {
	client := c.MilvusClient
	if client == nil && c.MilvusConfig != nil {
		var err error
		client, err = milvusclient.New(ctx, c.MilvusConfig)
		if err != nil {
			return false, err
		}
	}
	if client == nil {
		return false, fmt.Errorf("milvus client not configured")
	}
	_, err := client.DescribeCollection(ctx, milvusclient.NewDescribeCollectionOption(c.IndexName))
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// searchDocumentsByIDsMilvus Milvus 按 ID 查询文档，待实现
func (c *Config) searchDocumentsByIDsMilvus(ctx context.Context, knowledgeName string, docIDs []string, size int) ([]*schema.Document, error) {
	_ = knowledgeName
	_ = docIDs
	_ = size
	return nil, fmt.Errorf("SearchDocumentsByIDs for Milvus not implemented yet")
}
