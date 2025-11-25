package indexer

import (
	"backend/studyCoach/aiModel/CoachChat"
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino-ext/components/indexer/es8"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
)

// newAsyncIndexer component initialization function of node 'Indexer2' in graph 'rag'
func newAsyncIndexer(ctx context.Context, conf *common.Config) (idr indexer.Indexer, err error) {
	embeddingIns11, err := CoachChat.NewEmbedding(ctx, conf)
	if err != nil {
		return nil, err
	}
	if conf.Client != nil {
		// ES indexer
		indexerConfig := &es8.IndexerConfig{
			Client:    conf.Client,
			Index:     conf.IndexName,
			BatchSize: 10,
			DocumentToFields: func(ctx context.Context, doc *schema.Document) (field2Value map[string]es8.FieldValue, err error) {
				var knowledgeName string
				if value, ok := ctx.Value(common.KnowledgeName).(string); ok {
					knowledgeName = value
				} else {
					err = fmt.Errorf("必须提供知识库名称")
					return
				}
				if doc.MetaData != nil {
					// 存储ext数据
					marshal, _ := sonic.Marshal(getExtData(doc))
					doc.MetaData[common.FieldExtra] = string(marshal)
				}
				return map[string]es8.FieldValue{
					common.FieldContent: {
						Value:    doc.Content,
						EmbedKey: common.FieldContentVector,
					},
					common.FieldExtra: {
						Value: doc.MetaData[common.FieldExtra],
					},
					common.KnowledgeName: {
						Value: knowledgeName,
					},
					common.FieldQAContent: {
						Value:    doc.MetaData[common.FieldQAContent],
						EmbedKey: common.FieldQAContentVector,
					},
				}, nil
			},
		}
		indexerConfig.Embedding = embeddingIns11
		idr, err = es8.NewIndexer(ctx, indexerConfig)
		if err != nil {
			return nil, err
		}
		return idr, nil
	} else if conf.QdrantClient != nil {
		// Qdrant indexer
		idr, err = NewQdrantIndexer(ctx, &QdrantIndexerConfig{
			Client:     conf.QdrantClient,
			Collection: conf.IndexName,
			VectorDim:  1024, // 根据你的 embedding 模型调整
			Distance:   0,    // 使用默认 Cosine
			Embedding:  embeddingIns11,
			BatchSize:  10,
			IsAsync:    true,
		})
		if err != nil {
			return nil, err
		}
		return idr, nil
	} else {
		return nil, fmt.Errorf("no valid client configuration found")
	}
}
