package common

import (
	"context"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/create"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/exists"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"log"
)

func createEsIndex(ctx context.Context, client *elasticsearch.Client, indexName string) error {
	_, err := create.NewCreateFunc(client)(indexName).Request(&create.Request{
		Mappings: &types.TypeMapping{
			Properties: map[string]types.Property{
				FieldContent:  types.NewTextProperty(),
				FieldExtra:    types.NewTextProperty(),
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
