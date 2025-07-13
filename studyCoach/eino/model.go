package eino

import (
	"context"
	"fmt"
	"github.com/cloudwego/eino/components/model/openai"
	"github.com/cloudwego/eino/schema"
	"os"
)

func newChatModel(ctx context.Context, conf any) (r schema.ChatModel, err error) {
	modelType := os.Getenv("MODEL_TYPE")
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("OPENAI_BASE_URL")

	switch modelType {
	case "openai":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	case "deepseek":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("deepseek-chat"))
	case "qwen":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("qwen-plus"))
	default:
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	}

	if err != nil {
		return nil, err
	}
	return r, err
}

func BranchNewChatModel(ctx context.Context) (r schema.ChatModel, err error) {
	modelType := os.Getenv("MODEL_TYPE")
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("OPENAI_BASE_URL")

	switch modelType {
	case "openai":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	case "deepseek":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("deepseek-chat"))
	case "qwen":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("qwen-plus"))
	default:
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	}

	if err != nil {
		return nil, err
	}
	return r, err
}

func EmotionChatModel(ctx context.Context) (r schema.ChatModel, err error) {
	modelType := os.Getenv("MODEL_TYPE")
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("OPENAI_BASE_URL")

	switch modelType {
	case "openai":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	case "deepseek":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("deepseek-chat"))
	case "qwen":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("qwen-plus"))
	default:
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	}

	if err != nil {
		return nil, err
	}
	return r, err
}

func newChatModel2(ctx context.Context) (r schema.ChatModel, err error) {
	modelType := os.Getenv("MODEL_TYPE")
	apiKey := os.Getenv("OPENAI_API_KEY")
	baseURL := os.Getenv("OPENAI_BASE_URL")

	switch modelType {
	case "openai":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	case "deepseek":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("deepseek-chat"))
	case "qwen":
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("qwen-plus"))
	default:
		r, err = openai.NewChatModel(ctx, openai.WithAPIKey(apiKey), openai.WithBaseURL(baseURL), openai.WithModel("gpt-4o-mini"))
	}

	if err != nil {
		return nil, err
	}
	return r, err
}
