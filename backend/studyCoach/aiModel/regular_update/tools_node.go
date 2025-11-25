package regular_update

import (
	"context"
	"time"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo"
	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"
	"github.com/cloudwego/eino/components/tool"
)

type ToolImpl struct {
	config *ToolConfig
}

type ToolConfig struct {
}

func newTool(ctx context.Context) (bt tool.BaseTool, err error) {
	// TODO Modify component configuration here.
	config := &duckduckgo.Config{
		MaxResults: 5,
		Region:     ddgsearch.RegionWT,
		DDGConfig: &ddgsearch.Config{
			Timeout:    30 * time.Second,
			Cache:      true,
			MaxRetries: 4,
			Proxy:      "http://127.0.0.1:10808",
		},
	}
	bt, err = duckduckgo.NewTool(ctx, config)
	if err != nil {
		return nil, err
	}
	return bt, nil
}
