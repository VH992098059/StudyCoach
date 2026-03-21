package indexer

import (
	"backend/studyCoach/aiModel/CoachChat"
	"backend/studyCoach/aiModel/indexer/es"
	"backend/studyCoach/aiModel/indexer/milvus"
	"backend/studyCoach/aiModel/indexer/qdrant"
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/cloudwego/eino/components/indexer"
)

// newIndexer component initialization function of node 'Indexer2' in graph 'rag'
func newIndexer(ctx context.Context, conf *common.Config) (idr indexer.Indexer, err error) {
	embeddingIns11, err := CoachChat.NewEmbedding(ctx, conf)
	if err != nil {
		return nil, err
	}

	// 根据向量引擎创建 indexer：milvus > qdrant > es(默认)
	if conf.UseMilvus() {
		idr, err = milvus.NewIndexer(ctx, &milvus.Config{
			Client:       conf.MilvusClient,
			ClientConfig: conf.MilvusConfig,
			Collection:   conf.IndexName,
			VectorDim:    1024,
			Embedding:    embeddingIns11,
			BatchSize:    10,
		})
		if err != nil {
			return nil, err
		}
		return idr, nil
	}
	if conf.UseES() {
		idr, err = es.NewIndexer(ctx, &es.Config{
			Client:          conf.Client,
			Index:           conf.IndexName,
			BatchSize:       10,
			Embedding:       embeddingIns11,
			IncludeQAVector: false,
		})
		if err != nil {
			return nil, err
		}
		return idr, nil
	}
	if conf.UseQdrant() {
		idr, err = qdrant.NewIndexer(ctx, &qdrant.Config{
			Client:     conf.QdrantClient,
			Collection: conf.IndexName,
			VectorDim:  1024, // 根据你的 embedding 模型调整
			Distance:   0,    // 使用默认 Cosine
			Embedding:  embeddingIns11,
			BatchSize:  10,
			IsAsync:    false,
		})
		if err != nil {
			return nil, err
		}
		return idr, nil
	}
	return nil, fmt.Errorf("no valid client configuration found")
}
