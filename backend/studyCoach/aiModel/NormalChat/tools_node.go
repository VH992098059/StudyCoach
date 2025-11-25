package NormalChat

import (
	"context"

	"github.com/cloudwego/eino-ext/components/tool/duckduckgo/v2"
	"github.com/cloudwego/eino/components/tool"
)

func newTool(ctx context.Context) (bt tool.InvokableTool, err error) {
	// TODO Modify component configuration here.
	config := &duckduckgo.Config{}
	bt, err = duckduckgo.NewTextSearchTool(ctx, config)
	if err != nil {
		return nil, err
	}
	return bt, nil
}
