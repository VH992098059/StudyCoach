// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package ai_chat

import (
	"context"

	v1 "backend/api/ai_chat/v1"
)

type IAiChatV1 interface {
	AiChat(ctx context.Context, req *v1.AiChatReq) (res *v1.AiChatRes, err error)
	SaveSession(ctx context.Context, req *v1.SaveSessionReq) (res *v1.SaveSessionRes, err error)
	GetHistory(ctx context.Context, req *v1.GetHistoryReq) (res *v1.GetHistoryRes, err error)
	GetSession(ctx context.Context, req *v1.GetSessionReq) (res *v1.GetSessionRes, err error)
	DeleteSession(ctx context.Context, req *v1.DeleteSessionReq) (res *v1.DeleteSessionRes, err error)
}
