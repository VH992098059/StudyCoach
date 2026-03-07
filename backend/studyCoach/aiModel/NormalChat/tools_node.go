package NormalChat

import (
	"backend/studyCoach/common"
	"context"
	"log"

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
		log.Printf("[NormalChat] DuckDuckGo 搜索工具初始化失败: %v", err)
		return nil, err
	}
	log.Println("[NormalChat] 已加载 DuckDuckGo 搜索工具 (web_search)")
	return bt, nil
}
