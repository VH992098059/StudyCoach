package ai_chat

import (
	"backend/studyCoach/api"
	"backend/studyCoach/common"
	"context"
	"fmt"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"

	v1 "backend/api/ai_chat/v1"
)

func (c *ControllerV1) AiChat(ctx context.Context, req *v1.AiChatReq) (res *v1.AiChatRes, err error) {
	var streamReader *schema.StreamReader[*schema.Message]
	fmt.Printf("使用联网状态：%t，知识库使用：%s\n", req.IsNetwork, req.KnowledgeName)
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
