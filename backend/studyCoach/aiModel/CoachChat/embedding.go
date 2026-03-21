package CoachChat

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino-ext/components/embedding/ark"
	"github.com/cloudwego/eino/components/embedding"
)

func NewEmbedding(ctx context.Context, conf *common.Config) (eb embedding.Embedder, err error) {
	apiType := ark.APITypeMultiModal
	config := &ark.EmbeddingConfig{
		APIKey:  conf.APIKey,
		Model:   conf.ChatModel,
		BaseURL: conf.BaseURL,
		APIType: &apiType,
	}
	eb, err = ark.NewEmbedder(ctx, config)
	if err != nil {
		return nil, err
	}
	return eb, nil
}
