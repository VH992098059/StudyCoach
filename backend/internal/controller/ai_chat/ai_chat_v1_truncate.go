package ai_chat

import (
	v1 "backend/api/ai_chat/v1"
	logic "backend/internal/logic/ai_chat"
	"backend/utility"
	"context"
)

// TruncateMessages 编辑重发 / 重新生成时的服务端回滚：
// 删除指定时间戳之后的 DB 消息 + 将 LLM 历史 jsonl 截断为前 keepCount 条。
func (c *ControllerV1) TruncateMessages(ctx context.Context, req *v1.TruncateMessagesReq) (res *v1.TruncateMessagesRes, err error) {
	userId, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}

	deletedDb, keptLines, err := logic.GetChat().TruncateMessages(ctx, userId, req.SessionId, req.KeepCount, req.BeforeTimestamp)
	if err != nil {
		return nil, err
	}
	return &v1.TruncateMessagesRes{
		DeletedMessages: deletedDb,
		KeptLines:       keptLines,
	}, nil
}
