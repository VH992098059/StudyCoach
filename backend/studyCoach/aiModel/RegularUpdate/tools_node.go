package RegularUpdate

import (
	"backend/studyCoach/common"
	"context"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"
	duckduckgoV2 "github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2"
	"github.com/cloudwego/eino/components/tool"
)

type ToolImpl struct {
	config *ToolConfig
}

type ToolConfig struct {
}

func newTool(ctx context.Context) (bt tool.BaseTool, err error) {
	config := &duckduckgoV2.Config{
		ToolName:   "web_search",
		MaxResults: 10,
		Region:     duckduckgoV2.Region(ddgsearch.RegionWT),
		HTTPClient: common.ClientProxy(),
	}
	bt, err = duckduckgoV2.NewTextSearchTool(ctx, config)
	if err != nil {
		return nil, err
	}
	return bt, nil
}
