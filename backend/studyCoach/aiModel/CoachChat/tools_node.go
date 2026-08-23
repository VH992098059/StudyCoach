package CoachChat

import (
	"backend/studyCoach/common"
	"bufio"
	"context"
	"github.com/gogf/gf/v2/frame/g"
	"os"
	"path/filepath"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/ddgsearch"
	duckduckgoV2 "github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
)

func NewTool(ctx context.Context) (bt tool.InvokableTool, err error) {
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
func newTool1(ctx context.Context) (bt tool.InvokableTool, err error) {
	config := &duckduckgoV2.Config{
		ToolName:   "web_search",
		MaxResults: 10,
		Region:     duckduckgoV2.RegionWT,
		HTTPClient: common.ClientProxy(),
	}
	bt, err = duckduckgoV2.NewTextSearchTool(ctx, config)
	if err != nil {
		return nil, err
	}
	return bt, nil
}

// CreateMarkDownPlan 生成学习计划文件
func CreateMarkDownPlan(ctx context.Context, message *schema.Message) (bt tool.InvokableTool, err error) {
	targetDir := "../file"
	fileName := "Study_Plan.md"

	// 创建 file 文件夹（如果不存在）
	err = os.MkdirAll(targetDir, 0755)
	if err != nil {
		g.Log().Infof(ctx, "创建目录 %s 失败: %v", targetDir, err)
		return nil, err

	}
	//文件名拼接
	filePath := filepath.Join(targetDir, fileName)
	file, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	writer := bufio.NewWriter(file)
	_, err = writer.WriteString(message.Content)
	if err != nil {
		g.Log().Infof(ctx, "写入缓冲区失败: %v", err)
		return nil, err

	}
	err = writer.Flush()
	if err != nil {
		g.Log().Infof(ctx, "刷新缓冲区到文件失败: %v", err)
		return nil, err

	}
	g.Log().Info(ctx, "成功创建并写入 Study_Plan.md")
	return bt, nil
}
