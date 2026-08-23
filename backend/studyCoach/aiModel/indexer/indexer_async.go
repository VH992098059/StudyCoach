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

// newAsyncIndexer component initialization function of node 'Indexer2' in graph 'rag'
func newAsyncIndexer(ctx context.Context, conf *common.Config) (idr indexer.Indexer, err error) {
	embeddingIns11, err := CoachChat.NewEmbedding(ctx, conf)
	if err != nil {
		return nil, err
	}
	dim := conf.VectorDim
	if dim <= 0 {
		dim = 2048
	}
	if conf.UseMilvus() {
		idr, err = milvus.NewIndexer(ctx, &milvus.Config{
			Client:       conf.MilvusClient,
			ClientConfig: conf.MilvusConfig,
			Collection:   conf.IndexName,
			VectorDim:    dim,
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
			IncludeQAVector: true,
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
			VectorDim:  dim,
			Distance:   0, // 使用默认 Cosine
			Embedding:  embeddingIns11,
			BatchSize:  10,
			IsAsync:    true,
		})
		if err != nil {
			return nil, err
		}
		return idr, nil
	}
	return nil, fmt.Errorf("no valid client configuration found")
}
