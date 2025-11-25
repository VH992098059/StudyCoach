package CoachChat

import (
	"backend/studyCoach/common"
	"context"
	"time"

	"github.com/cloudwego/eino-ext/components/embedding/openai"
	"github.com/cloudwego/eino/components/embedding"
)

func NewEmbedding(ctx context.Context, conf *common.Config) (eb embedding.Embedder, err error) {
	config := &openai.EmbeddingConfig{
		Timeout:    30 * time.Second,
		APIKey:     conf.APIKey,
		Model:      conf.ChatModel,
		BaseURL:    conf.BaseURL,
		Dimensions: common.TypeOf(1024),
	}
	eb, err = openai.NewEmbedder(ctx, config)
	if err != nil {
		return nil, err
	}
	return eb, nil
}
