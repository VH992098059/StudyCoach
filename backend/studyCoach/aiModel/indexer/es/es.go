// Package es 提供基于 Elasticsearch 8（eino-ext es8）的向量索引实现。
package es

import (
	"backend/studyCoach/aiModel/indexer/docmeta"
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino-ext/components/indexer/es8"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	"github.com/elastic/go-elasticsearch/v8"
	"github.com/google/uuid"
)

// Config ES8 索引配置。
type Config struct {
	Client    *elasticsearch.Client
	Index     string
	BatchSize int
	Embedding embedding.Embedder
	// IncludeQAVector 为 true 时在字段映射中包含 QA 文本与向量（异步索引路径）。
	IncludeQAVector bool
}

// NewIndexer 创建 ES8 索引器。
func NewIndexer(ctx context.Context, config *Config) (indexer.Indexer, error) {
	if config.Client == nil {
		return nil, fmt.Errorf("elasticsearch client is required")
	}
	if config.Index == "" {
		return nil, fmt.Errorf("index name is required")
	}
	if config.Embedding == nil {
		return nil, fmt.Errorf("embedding is required")
	}
	batch := config.BatchSize
	if batch <= 0 {
		batch = 10
	}

	indexerConfig := &es8.IndexerConfig{
		Client:    config.Client,
		Index:     config.Index,
		BatchSize: batch,
		DocumentToFields: func(ctx context.Context, doc *schema.Document) (field2Value map[string]es8.FieldValue, err error) {
			var knowledgeName string
			if value, ok := ctx.Value(common.KnowledgeName).(string); ok {
				knowledgeName = value
			} else {
				return nil, fmt.Errorf("必须提供知识库名称")
			}
			if !config.IncludeQAVector && len(doc.ID) == 0 {
				doc.ID = uuid.New().String()
			}
			if doc.MetaData != nil {
				marshal, _ := sonic.Marshal(docmeta.GetExtData(doc))
				doc.MetaData[common.FieldExtra] = string(marshal)
			}
			fields := map[string]es8.FieldValue{
				common.FieldContent: {
					Value:    doc.Content,
					EmbedKey: common.FieldContentVector,
				},
				common.FieldExtra: {
					Value: doc.MetaData[common.FieldExtra],
				},
				common.FieldCronID: {
					Value: doc.MetaData[common.FieldCronID],
				},
				common.KnowledgeName: {
					Value: knowledgeName,
				},
			}
			if config.IncludeQAVector {
				qaText, _ := doc.MetaData[common.FieldQAContent].(string)
				if qaText == "" {
					// 与 qa.go 降级策略一致，避免 nil / 非 string 触发 es8 bulkAdd 断言失败
					if doc.Content != "" {
						r := []rune(doc.Content)
						if len(r) > 512 {
							qaText = string(r[:512])
						} else {
							qaText = doc.Content
						}
					} else {
						qaText = " "
					}
				}
				fields[common.FieldQAContent] = es8.FieldValue{
					Value:    qaText,
					EmbedKey: common.FieldQAContentVector,
				}
			}
			return fields, nil
		},
	}
	indexerConfig.Embedding = config.Embedding
	return es8.NewIndexer(ctx, indexerConfig)
}
