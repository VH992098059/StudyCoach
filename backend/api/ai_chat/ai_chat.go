// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package ai_chat

import (
	"context"

	"backend/api/ai_chat/v1"
)

type IAiChatV1 interface {
	AiChat(ctx context.Context, req *v1.AiChatReq) (res *v1.AiChatRes, err error)
}
