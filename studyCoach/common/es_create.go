package common

import (
	"context"
	"fmt"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/create"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/exists"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
)

// createEsIndex 创建Elasticsearch索引
func createEsIndex(ctx context.Context, client *elasticsearch.TypedClient, indexName string) error {
	// 定义索引映射
	mapping := &types.TypeMapping{
		Properties: map[string]types.Property{
			FieldContent: types.NewTextProperty(),
			FieldContentVector: &types.DenseVectorProperty{
				Dims: TypeOf(1024),
			},
			FieldExtra:    types.NewTextProperty(),
			KnowledgeName: types.NewKeywordProperty(),
			ImageURL:      types.NewKeywordProperty(),
			ImageVector: &types.DenseVectorProperty{
				Dims: TypeOf(512), // 图片向量维度
			},
			ImageFeatures: types.NewTextProperty(),
		},
	}

	// 创建索引请求
	req := &create.Request{
		Mappings: mapping,
	}

	// 执行创建索引
	_, err := client.Indices.Create(indexName).Request(req).Do(ctx)
	if err != nil {
		return fmt.Errorf("创建索引失败: %w", err)
	}

	fmt.Printf("索引 %s 创建成功\n", indexName)
	return nil
}

// CreateIndexIfNotExists 检查索引是否存在，如果不存在则创建
func CreateIndexIfNotExists(ctx context.Context, client *elasticsearch.TypedClient, indexName string) error {
	// 检查索引是否存在
	existsReq := &exists.Request{}
	existsResp, err := client.Indices.Exists(indexName).Request(existsReq).Do(ctx)
	if err != nil {
		return fmt.Errorf("检查索引是否存在失败: %w", err)
	}

	// 如果索引不存在，则创建
	if !existsResp {
		return createEsIndex(ctx, client, indexName)
	}

	fmt.Printf("索引 %s 已存在\n", indexName)
	return nil
}
