package common

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/create"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/exists"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/gogf/gf/v2/frame/g"
)

func createEsIndex(ctx context.Context, client *elasticsearch.Client, indexName string) error {
	_, err := create.NewCreateFunc(client)(indexName).Request(&create.Request{
		Mappings: &types.TypeMapping{
			Properties: map[string]types.Property{
				FieldContent:  types.NewTextProperty(),
				FieldExtra:    types.NewTextProperty(),
				FieldCronID:   types.NewKeywordProperty(),
				KnowledgeName: types.NewTextProperty(),
				FieldContentVector: &types.DenseVectorProperty{
					Dims:  TypeOf(1024),
					Index: TypeOf(true),
				},
			},
		},
	}).Do(ctx)
	if err != nil {
		return err
	}
	return err
}
func CreateIndexIfNotExists(ctx context.Context, client *elasticsearch.Client, indexName string) error {
	indexExists, err := exists.NewExistsFunc(client)(indexName).Do(ctx)
	if err != nil {
		log.Printf("Checking if index '%s' exists...", indexName)   // 新增日志
		log.Printf("Error creating index '%s': %v", indexName, err) // 新增日志
		return err
	}
	if indexExists {
		return nil
	}
	err = createEsIndex(ctx, client, indexName)
	return err
}

// DeleteDocument 删除索引中的单个文档
func DeleteDocument(ctx context.Context, client *elasticsearch.Client, documentID string) error {
	return withRetry(func() error {
		indexName := g.Cfg().MustGet(ctx, "es.indexName").String()
		res, err := client.Delete(indexName, documentID)
		if err != nil {
			return fmt.Errorf("delete document failed: %w", err)
		}
		defer res.Body.Close()

		if res.IsError() {
			return fmt.Errorf("delete document failed: %s", res.String())
		}

		return nil
	})
}

// withRetry 包装函数，添加重试机制
func withRetry(operation func() error) error {
	b := backoff.NewExponentialBackOff()
	b.MaxElapsedTime = 30 * time.Second

	return backoff.Retry(operation, b)
}

// DeleteDocumentsByCronID 删除指定CronID的所有文档
func DeleteDocumentsByCronID(ctx context.Context, client *elasticsearch.Client, cronID string) error {
	return withRetry(func() error {
		indexName := g.Cfg().MustGet(ctx, "es.indexName").String()

		// 构造删除查询
		query := map[string]interface{}{
			"query": map[string]interface{}{
				"term": map[string]interface{}{
					FieldCronID: cronID,
				},
			},
		}

		var buf bytes.Buffer
		if err := json.NewEncoder(&buf).Encode(query); err != nil {
			return fmt.Errorf("encode query failed: %w", err)
		}

		// 使用 DeleteByQuery API
		// 注意：DeleteByQuery 需要 explicit index
		res, err := client.DeleteByQuery([]string{indexName}, &buf)
		if err != nil {
			return fmt.Errorf("delete by query failed: %w", err)
		}
		defer res.Body.Close()

		if res.IsError() {
			return fmt.Errorf("delete by query failed: %s", res.String())
		}

		return nil
	})
}
