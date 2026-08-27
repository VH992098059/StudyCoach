package NormalChat

import (
	"backend/studyCoach/common"
	"context"
	"github.com/gogf/gf/v2/frame/g"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"
	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2"
	"github.com/cloudwego/eino/components/tool"
)

func newTool(ctx context.Context) (bt tool.InvokableTool, err error) {
	config := &duckduckgo.Config{
		ToolName:   "web_search",
		ToolDesc:   "Search the web for real-time information. Use this when the user asks about current events, news, weather, or any information that may have changed recently.",
		MaxResults: 10,
		Region:     duckduckgo.Region(ddgsearch.RegionWT),
		HTTPClient: common.ClientProxy(),
	}
	bt, err = duckduckgo.NewTextSearchTool(ctx, config)
	if err != nil {
		g.Log().Infof(ctx, "[NormalChat] DuckDuckGo 搜索工具初始化失败: %v", err)
		return nil, err
	}
	g.Log().Info(ctx, "[NormalChat] 已加载 DuckDuckGo 搜索工具 (web_search)")
	// 搜索被反爬/限流时降级为文本结果，避免工具报错触发全图重试
	return common.WrapToolFallback(bt, common.ToolSearchFallbackHint), nil
}
