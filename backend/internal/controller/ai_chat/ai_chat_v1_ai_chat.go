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

	var streamReader *schema.StreamReader[*schema.Message]
	fmt.Printf("使用联网状态：%t，知识库使用：%s\n", req.IsNetwork, req.KnowledgeName)
	if req.IsStudyMode != true {
		streamReader, err = api.ChatNormalModel(ctx, req)
		if err != nil {
			g.Log().Error(ctx, err)
			return nil, err
		}
		defer streamReader.Close()
		err = common.SteamResponse(ctx, streamReader, nil)
		if err != nil {
			g.Log().Error(ctx, err)
			return nil, err
		}
		return &v1.AiChatRes{}, nil
	}
	streamReader, err = api.ChatAiModel(ctx, req)
	if err != nil {
		g.Log().Error(ctx, err)
		return nil, err
	}
	defer streamReader.Close()
	err = common.SteamResponse(ctx, streamReader, nil)
	if err != nil {
		g.Log().Error(ctx, err)
		return nil, err
	}

	return &v1.AiChatRes{}, nil
}
