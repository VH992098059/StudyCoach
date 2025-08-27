package mcp

import (
	"context"
	"encoding/json"

	"github.com/cloudwego/eino/schema"
	"github.com/mark3labs/mcp-go/mcp"
)

type ToolAdapter struct {
	name        string
	description string
	handler     func(context.Context, mcp.CallToolRequest) (*mcp.CallToolResult, error)
	schema      map[string]*schema.ParameterInfo
}

func (m *ToolAdapter) Info(ctx context.Context) (*schema.ToolInfo, error) {
	return &schema.ToolInfo{
		Name:        m.name,
		Desc:        m.description,
		ParamsOneOf: schema.NewParamsOneOfByParams(m.schema),
	}, nil
}

func (m *ToolAdapter) GetName() string {
	return m.name
}
func (m *ToolAdapter) GetDescription() string {
	return m.description
}
func (m *ToolAdapter) InvokableRun(ctx context.Context, params string) (string, error) {
	// 解析参数
	var args map[string]interface{}
	if err := json.Unmarshal([]byte(params), &args); err != nil {
		return "", err
	}
	// 构造MCP请求
	request := mcp.CallToolRequest{
		Params: mcp.CallToolParams{
			Name:      m.name,
			Arguments: args,
		},
	}
	// 调用MCP处理器
	result, err := m.handler(ctx, request)
	if err != nil {
		return "", err
	}
	if result.Content != nil && len(result.Content) > 0 {
		if textContent, ok := result.Content[0].(*mcp.TextContent); ok {
			return textContent.Text, nil
		}
	}
	return "", err
}
