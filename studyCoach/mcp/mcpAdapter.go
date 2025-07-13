package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
)

// ToolAdapter 将MCP工具封装为Eino框架可用的工具
type ToolAdapter struct {
	name        string
	description string
	handler     func(ctx context.Context, params map[string]interface{}) (interface{}, error)
	schema      *schema.ToolInfo
}

// NewToolAdapter 创建新的工具适配器
func NewToolAdapter(name, description string, handler func(ctx context.Context, params map[string]interface{}) (interface{}, error)) *ToolAdapter {
	return &ToolAdapter{
		name:        name,
		description: description,
		handler:     handler,
		schema: &schema.ToolInfo{
			Name:        name,
			Description: description,
			ParamsOneOf: schema.NewParamsOneOfByParams(map[string]*schema.ParameterInfo{
				// 这里可以根据具体工具定义参数
			}),
		},
	}
}

// Info 返回工具信息
func (t *ToolAdapter) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return t.schema, nil
}

// Name 返回工具名称
func (t *ToolAdapter) Name() string {
	return t.name
}

// Description 返回工具描述
func (t *ToolAdapter) Description() string {
	return t.description
}

// InvokeableInvoke 调用工具
func (t *ToolAdapter) InvokeableInvoke(ctx context.Context, params map[string]any) (any, error) {
	if t.handler == nil {
		return nil, fmt.Errorf("tool handler not implemented")
	}

	// 将参数转换为map[string]interface{}
	convertedParams := make(map[string]interface{})
	for k, v := range params {
		convertedParams[k] = v
	}

	return t.handler(ctx, convertedParams)
}

// Invoke 实现tool.BaseTool接口
func (t *ToolAdapter) Invoke(ctx context.Context, params string) (string, error) {
	// 解析JSON参数
	var paramMap map[string]interface{}
	if err := json.Unmarshal([]byte(params), &paramMap); err != nil {
		return "", fmt.Errorf("failed to parse parameters: %w", err)
	}

	// 调用处理器
	result, err := t.handler(ctx, paramMap)
	if err != nil {
		return "", err
	}

	// 将结果转换为JSON字符串
	resultBytes, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("failed to marshal result: %w", err)
	}

	return string(resultBytes), nil
}

// 确保ToolAdapter实现了所需的接口
var _ tool.BaseTool = (*ToolAdapter)(nil)
var _ tool.InvokableTool = (*ToolAdapter)(nil)
