package asr

import (
	"context"
	"sync"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

var (
	asrModelMu   sync.RWMutex
	asrModelInst compose.Runnable[map[string]any, *schema.Message]
)

// GetOrBuildASRModel 返回全局单例 ASR Runnable，首次调用时编译图，后续复用缓存。
func GetOrBuildASRModel(ctx context.Context) (compose.Runnable[map[string]any, *schema.Message], error) {
	asrModelMu.RLock()
	inst := asrModelInst
	asrModelMu.RUnlock()
	if inst != nil {
		return inst, nil
	}

	asrModelMu.Lock()
	defer asrModelMu.Unlock()
	if asrModelInst != nil {
		return asrModelInst, nil
	}
	newInst, err := BuildaiModelASR(ctx)
	if err != nil {
		return nil, err
	}
	asrModelInst = newInst
	return asrModelInst, nil
}

func BuildaiModelASR(ctx context.Context) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		CustomTemplate = "CustomTemplate"
		ChatModelASR   = "ChatModelASR"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	customTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(CustomTemplate, customTemplateKeyOfChatTemplate)
	chatModelASRKeyOfChatModel, err := newChatModel(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(ChatModelASR, chatModelASRKeyOfChatModel)
	_ = g.AddEdge(compose.START, CustomTemplate)
	_ = g.AddEdge(ChatModelASR, compose.END)
	_ = g.AddEdge(CustomTemplate, ChatModelASR)
	r, err = g.Compile(ctx, compose.WithGraphName("aiModelASR"))
	if err != nil {
		return nil, err
	}
	return r, err
}
