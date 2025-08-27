package eino

import (
	"backend/studyCoach/common"
	configTool "backend/studyCoach/configTool"
	"context"
	"time"

	"github.com/cloudwego/eino-ext/components/embedding/openai"
	"github.com/cloudwego/eino/components/embedding"
)

func NewEmbedding(ctx context.Context, conf *configTool.Config) (eb embedding.Embedder, err error) {
	// TODO Modify component configuration here.
	config := &openai.EmbeddingConfig{
		Timeout:    30 * time.Second,
		APIKey:     conf.ApiKey,
		Model:      conf.Model,
		BaseURL:    conf.BaseURL,
		Dimensions: common.TypeOf(1024),
	}
	eb, err = openai.NewEmbedder(ctx, config)
	if err != nil {
		return nil, err
	}
	return eb, nil
}
func newEmbedding1(ctx context.Context, conf *configTool.Config) (eb embedding.Embedder, err error) {
	// TODO Modify component configuration here.
	config := &openai.EmbeddingConfig{
		Timeout:    30 * time.Second,
		APIKey:     conf.ApiKey,
		Model:      conf.Model,
		BaseURL:    conf.BaseURL,
		Dimensions: common.TypeOf(1024),
	}
	eb, err = openai.NewEmbedder(ctx, config)
	if err != nil {
		return nil, err
	}
	return eb, nil
}
