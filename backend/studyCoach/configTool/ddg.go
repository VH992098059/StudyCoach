package configTool

import (
	"backend/studyCoach/common"
	"context"
	"github.com/gogf/gf/v2/frame/g"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"
	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2"
	"github.com/cloudwego/eino/components/tool"
)

func DdgNewTool(ctx context.Context) (bt tool.InvokableTool, err error) {
	config := &duckduckgo.Config{
		ToolName:   "web_search",
		ToolDesc:   "这是用于搜索内容的工具",
		MaxResults: 10,
		Region:     duckduckgo.Region(ddgsearch.RegionWT),
		HTTPClient: common.ClientProxy(),
	}
	bt, err = duckduckgo.NewTextSearchTool(ctx, config)
	if err != nil {
		return nil, err
	}
	g.Log().Info(ctx, "使用ddg_search")
	return bt, nil
}
