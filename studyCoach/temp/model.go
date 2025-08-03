package temp

import (
	"context"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
)

// newChatModel component initialization function of node 'AnalysisChatModel' in graph 'studyCoachFor'
func newChatModel(ctx context.Context) (cm model.ChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func newChatModel1(ctx context.Context) (cm model.ChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel2 component initialization function of node 'ToStudyChatModel' in graph 'studyCoachFor'
func newChatModel2(ctx context.Context) (cm model.ChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel3 component initialization function of node 'NormalChatModel' in graph 'studyCoachFor'
func newChatModel3(ctx context.Context) (cm model.ChatModel, err error) {
	// TODO Modify component configuration here.
	config := &ark.ChatModelConfig{}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel4 component initialization function of node 'EmotionAndCompanionChatModel' in graph 'studyCoachFor'
func newChatModel4(ctx context.Context) (cm model.ChatModel, err error) {
	// TODO Modify component configuration here.
	config := &ark.ChatModelConfig{}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
