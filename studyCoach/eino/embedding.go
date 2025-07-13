package eino

import (
	"context"
	"github.com/cloudwego/eino/components/embedding/openai"
	"github.com/cloudwego/eino/schema"
	"os"
)

func newEmbedding(ctx context.Context) (r schema.Embedder, err error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("OPENAI_BASE_URL")
	r, err = openai.NewEmbedder(ctx, openai.WithAPIKey(apiKey), openai.WithModel("Pro/BAAI/bge-m3"), openai.WithBaseURL(baseURL))
	if err != nil {
		return nil, err
	}
	return r, err
}

func newEmbedding1(ctx context.Context) (r schema.Embedder, err error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("OPENAI_BASE_URL")
	r, err = openai.NewEmbedder(ctx, openai.WithAPIKey(apiKey), openai.WithModel("Pro/BAAI/bge-m3"), openai.WithBaseURL(baseURL))
	if err != nil {
		return nil, err
	}
	return r, err
}
