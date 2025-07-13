package ai_chat

import (
	"context"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"studyCoach/studyCoach/api"
	"studyCoach/studyCoach/common"

	"backend/api/ai_chat/v1"
)

func (c *ControllerV1) AiChat(ctx context.Context, req *v1.AiChatReq) (res *v1.AiChatRes, err error) {
	var streamReader *schema.StreamReader[*schema.Message]
	streamReader, err = api.ChatAiModel(ctx, false, req.Question, req.ID, req.KnowledgeName)
	if err != nil {
		g.Log().Error(ctx, err)
		return &v1.AiChatRes{}, nil
	}
	defer streamReader.Close()
	err = common.SteamResponse(ctx, streamReader, nil)
	if err != nil {
		g.Log().Error(ctx, err)
		return
	}
	return &v1.AiChatRes{}, nil
}
