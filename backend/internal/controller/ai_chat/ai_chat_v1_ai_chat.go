package ai_chat

import (
	"backend/studyCoach/api"
	"backend/studyCoach/common"
	"context"
	"fmt"
	"time"

	v1 "backend/api/ai_chat/v1"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) AiChat(ctx context.Context, req *v1.AiChatReq) (res *v1.AiChatRes, err error) {
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		g.Log().Infof(ctx, "AiChat 接口总耗时: %v", duration)
	}()

	// 调试：打印 MultiContent
	multiContent := req.GetMultiContent()
	g.Log().Infof(ctx, "MultiContent 长度: %d", len(multiContent))
	for i, part := range multiContent {
		g.Log().Infof(ctx, "MultiContent[%d]: Type=%s, Text=%s, Base64Data长度=%d",
			i, part.Type, part.Text, len(part.Base64Data))
	}

	var streamReader *schema.StreamReader[*schema.Message]
	fmt.Printf("使用联网状态：%t，知识库使用：%s\n", req.IsNetwork, req.KnowledgeName)
	if req.IsStudyMode != true {
		streamReader, documents, err := api.ChatNormalModel(ctx, req)
		if err != nil {
			g.Log().Error(ctx, err)
			return nil, err
		}
		defer streamReader.Close()
		err = common.SteamResponse(ctx, streamReader, documents)
		if err != nil {
			g.Log().Error(ctx, err)
			return nil, err
		}
		return &v1.AiChatRes{}, nil
	}
	streamReader, documents, err := api.ChatAiModel(ctx, req)
	if err != nil {
		g.Log().Error(ctx, err)
		return nil, err
	}
	defer streamReader.Close()
	err = common.SteamResponse(ctx, streamReader, documents)
	if err != nil {
		g.Log().Error(ctx, err)
		return nil, err
	}

	return &v1.AiChatRes{}, nil
}
