// Package knowledge 提供知识库检索工具，供 ReAct Agent 调用以主动查询知识库内容。
package knowledge

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
)

// RetrieverFunc 知识库检索函数类型，运行时从 context 获取 Rag 实例
type RetrieverFunc func(ctx context.Context, query string, topK int, score float64, knowledgeName string, metadataFilter map[string]interface{}) ([]*schema.Document, error)

// RetrieverKey context key for RetrieverFunc
type RetrieverKey struct{}

// KnowledgeNameKey context key for knowledge base name
type KnowledgeNameKey struct{}

// Tool 实现知识库搜索工具
type Tool struct{}

// NewTool 创建知识库搜索工具
func NewTool() (tool.BaseTool, error) {
	return &Tool{}, nil
}

func (t *Tool) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name: "search_knowledge",
		Desc: `搜索知识库内容。可按关键词检索知识库中的文档，支持按更新类型过滤。
- 查询知识库中有哪些增量内容时，使用 update_type=2
- 查询全量内容时，使用 update_type=1
- 不指定 update_type 时返回所有内容
返回匹配的文档片段列表。`,
		ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
			"query": {
				Type:     schema.String,
				Desc:     "搜索关键词",
				Required: true,
			},
			"update_type": {
				Type:     schema.Integer,
				Desc:     "更新类型过滤：1=全量更新, 2=增量更新。不传则不过滤",
				Required: false,
			},
			"top_k": {
				Type:     schema.Integer,
				Desc:     "返回结果数量，默认5",
				Required: false,
			},
		}),
	}, nil
}

func (t *Tool) InvokableRun(ctx context.Context, argumentsInJSON string, opts ...tool.Option) (string, error) {
	var params struct {
		Query      string `json:"query"`
		UpdateType *int   `json:"update_type,omitempty"`
		TopK       *int   `json:"top_k,omitempty"`
	}
	if err := json.Unmarshal([]byte(argumentsInJSON), &params); err != nil {
		return "", fmt.Errorf("参数解析失败: %w", err)
	}
	if params.Query == "" {
		return "", fmt.Errorf("query 不能为空")
	}

	retrieveFn, _ := ctx.Value(RetrieverKey{}).(RetrieverFunc)
	if retrieveFn == nil {
		return "", fmt.Errorf("知识库检索器未初始化")
	}
	knowledgeName, _ := ctx.Value(KnowledgeNameKey{}).(string)

	topK := 5
	if params.TopK != nil && *params.TopK > 0 {
		topK = *params.TopK
	}

	var metadataFilter map[string]interface{}
	if params.UpdateType != nil {
		metadataFilter = map[string]interface{}{"update_type": *params.UpdateType}
	}

	docs, err := retrieveFn(ctx, params.Query, topK, 0.3, knowledgeName, metadataFilter)
	if err != nil {
		return "", fmt.Errorf("知识库检索失败: %w", err)
	}

	if len(docs) == 0 {
		return "未找到匹配的知识库内容", nil
	}

	result := fmt.Sprintf("找到 %d 条相关内容：\n\n", len(docs))
	for i, doc := range docs {
		result += fmt.Sprintf("[%d] %s\n\n", i+1, truncate(doc.Content, 500))
	}
	return result, nil
}

func truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}
