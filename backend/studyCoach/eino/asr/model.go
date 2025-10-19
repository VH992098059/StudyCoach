package asr

import (
	"context"
	"os"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
)

// newChatModel component initialization function of node 'ChatModelASR' in graph 'aiModelASR'
func newChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{
		Model:   "deepseek-ai/DeepSeek-V3",
		APIKey:  os.Getenv("Openai_API_Key"),
		BaseURL: os.Getenv("Base_URL"),
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
