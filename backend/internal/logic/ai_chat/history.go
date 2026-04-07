package ai_chat

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	v1 "backend/api/ai_chat/v1"
	"backend/internal/dao"
	"backend/internal/model/entity"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// SaveSession 保存会话
func (c *ChatBase) SaveSession(ctx context.Context, userId string, req *v1.SaveSessionReq) (string, error) {
	// Use req.Id as session UUID
	sessionUuid := req.Id
	if sessionUuid == "" {
		// If frontend doesn't provide ID, generate one
		sessionUuid = fmt.Sprintf("%d", gtime.TimestampMilli())
	}

	err := dao.ChatSessions.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		now := gtime.Now()

		// 1. Try Update first (Optimistic for existing sessions)
		updateRes, err := dao.ChatSessions.Ctx(ctx).TX(tx).
			Data(g.Map{
				dao.ChatSessions.Columns().Title:     req.Title,
				dao.ChatSessions.Columns().UpdatedAt: now,
			}).
			Where(dao.ChatSessions.Columns().Uuid, sessionUuid).
			Update()

		if err != nil {
			return err
		}

		rowsAffected, _ := updateRes.RowsAffected()

		if rowsAffected == 0 {
			// 2. If Update failed (not found), Try Insert
			sessionData := entity.ChatSessions{
				Uuid:      sessionUuid,
				UserId:    userId,
				Title:     req.Title,
				CreatedAt: now,
				UpdatedAt: now,
			}
			// Note: Id is auto-increment, not set here.

			_, err = dao.ChatSessions.Ctx(ctx).TX(tx).Data(sessionData).Insert()
			if err != nil {
				// Check if it is a duplicate entry error (Race condition: inserted by another thread)
				if strings.Contains(err.Error(), "Duplicate entry") {
					// 3. If Insert failed (duplicate), Try Update again
					_, updateErr := dao.ChatSessions.Ctx(ctx).TX(tx).
						Data(g.Map{
							dao.ChatSessions.Columns().Title:     req.Title,
							dao.ChatSessions.Columns().UpdatedAt: now,
						}).
						Where(dao.ChatSessions.Columns().Uuid, sessionUuid).
						Update()
					if updateErr != nil {
						return updateErr
					}
				} else {
					// Other errors
					return err
				}
			}
		}

		// 2. Save Messages
		if len(req.Messages) > 0 {
			// Get existing messages map for this session to handle updates correctly
			var existingMsgs []entity.ChatMessages
			err := dao.ChatMessages.Ctx(ctx).TX(tx).
				Where(dao.ChatMessages.Columns().SessionUuid, sessionUuid).
				Fields(dao.ChatMessages.Columns().Id, dao.ChatMessages.Columns().MsgId).
				Scan(&existingMsgs)
			if err != nil {
				return err
			}

			msgIdMap := make(map[string]int64)
			for _, m := range existingMsgs {
				msgIdMap[m.MsgId] = m.Id
			}

			for _, msg := range req.Messages {
				// 构建基础数据
				data := g.Map{
					dao.ChatMessages.Columns().SessionUuid:      sessionUuid,
					dao.ChatMessages.Columns().MsgId:            msg.MsgId,
					dao.ChatMessages.Columns().Content:          msg.Content,
					dao.ChatMessages.Columns().IsUser:           0,
					dao.ChatMessages.Columns().Timestamp:        msg.Timestamp,
					dao.ChatMessages.Columns().ReasoningContent: msg.ReasoningContent,
				}

				// 只有当 MultiContent 不为空时才添加该字段
				if len(msg.MultiContent) > 0 {
					multiJSON, _ := json.Marshal(msg.MultiContent)
					data[dao.ChatMessages.Columns().MultiContent] = string(multiJSON)
				}

				if msg.IsUser {
					data[dao.ChatMessages.Columns().IsUser] = 1
				}

				// 如果存在则更新，否则插入
				if existingId, ok := msgIdMap[msg.MsgId]; ok {
					_, err = dao.ChatMessages.Ctx(ctx).TX(tx).
						Where(dao.ChatMessages.Columns().Id, existingId).
						Data(data).
						Update()
				} else {
					_, err = dao.ChatMessages.Ctx(ctx).TX(tx).Data(data).Insert()
				}
				if err != nil {
					return err
				}
			}
		}

		return nil
	})
	return sessionUuid, err
}

// GetHistory 获取历史会话（分页）
func (c *ChatBase) GetHistory(ctx context.Context, userId string, page, pageSize int) ([]v1.ChatSession, int, error) {
	// 先查总数
	total, err := dao.ChatSessions.Ctx(ctx).Where(dao.ChatSessions.Columns().UserId, userId).Count()
	if err != nil {
		return nil, 0, err
	}

	// 分页查询
	var sessions []entity.ChatSessions
	offset := (page - 1) * pageSize
	err = dao.ChatSessions.Ctx(ctx).
		Where(dao.ChatSessions.Columns().UserId, userId).
		OrderDesc(dao.ChatSessions.Columns().UpdatedAt).
		Limit(pageSize).
		Offset(offset).
		Scan(&sessions)
	if err != nil {
		return nil, 0, err
	}

	res := make([]v1.ChatSession, 0, len(sessions))
	for _, s := range sessions {
		res = append(res, v1.ChatSession{
			Id:        s.Uuid, // Return UUID as ID to frontend
			Title:     s.Title,
			CreatedAt: s.CreatedAt,
			UpdatedAt: s.UpdatedAt,
		})
	}
	return res, total, nil
}

// GetSession 获取单个会话详情（支持滚动加载）
func (c *ChatBase) GetSession(ctx context.Context, userId string, sessionId string, beforeMsgId int64, limit int) (*v1.GetSessionRes, error) {
	var session entity.ChatSessions
	// Query by UUID
	err := dao.ChatSessions.Ctx(ctx).
		Where(dao.ChatSessions.Columns().Uuid, sessionId).
		Where(dao.ChatSessions.Columns().UserId, userId).
		Scan(&session)
	if err != nil {
		return nil, err
	}
	if session.Id == 0 { // Check if found (Id should be > 0)
		return nil, fmt.Errorf("session not found")
	}

	var messages []entity.ChatMessages
	query := dao.ChatMessages.Ctx(ctx).
		Where(dao.ChatMessages.Columns().SessionUuid, sessionId)

	// 滚动加载条件：返回早于beforeMsgId的消息
	if beforeMsgId > 0 {
		query = query.WhereLT(dao.ChatMessages.Columns().Id, beforeMsgId)
	}

	// 按ID倒序取最新的limit条，再反转成正序，保持时间升序排列
	err = query.
		OrderDesc(dao.ChatMessages.Columns().Id).
		Limit(limit).
		Scan(&messages)
	if err != nil {
		return nil, err
	}

	// 反转切片，恢复时间升序
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	res := &v1.GetSessionRes{
		Id:        session.Uuid, // Return UUID
		Title:     session.Title,
		CreatedAt: session.CreatedAt,
		UpdatedAt: session.UpdatedAt,
		Messages:  make([]v1.ChatMessage, 0, len(messages)),
	}

	for _, m := range messages {
		isUser := false
		if m.IsUser == 1 {
			isUser = true
		}
		chatMsg := v1.ChatMessage{
			Id:               m.Id,
			MsgId:            m.MsgId,
			Content:          m.Content,
			IsUser:           isUser,
			Timestamp:        m.Timestamp,
			ReasoningContent: m.ReasoningContent,
		}
		// 解析多模态内容
		if m.MultiContent != "" {
			var multiContent []v1.MessagePart
			if err := json.Unmarshal([]byte(m.MultiContent), &multiContent); err == nil {
				chatMsg.MultiContent = multiContent
			} else {
				g.Log().Warningf(ctx, "failed to unmarshal multi_content for msg %s: %v, raw: %s", m.MsgId, err, m.MultiContent)
			}
		}
		res.Messages = append(res.Messages, chatMsg)
	}

	return res, nil
}

// DeleteSession 删除会话
func (c *ChatBase) DeleteSession(ctx context.Context, userId string, sessionId string) error {
	// Delete by UUID
	_, err := dao.ChatSessions.Ctx(ctx).
		Where(dao.ChatSessions.Columns().Uuid, sessionId).
		Where(dao.ChatSessions.Columns().UserId, userId).
		Delete()
	return err
}

// MergeSessionInput 合并会话的输入（登录时传入的未登录会话）
type MergeSessionInput struct {
	Id       string
	Title    string
	Messages []MergeMessageInput
}

// MergeMessageInput 合并消息的输入
type MergeMessageInput struct {
	MsgId            string
	Content          string
	IsUser           bool
	Timestamp        *gtime.Time
	ReasoningContent string
}

// MergeAnonymousSessions 将未登录时的会话合并到用户历史（登录后由后端调用）
func (c *ChatBase) MergeAnonymousSessions(ctx context.Context, userId string, sessions []MergeSessionInput) error {
	for _, s := range sessions {
		if s.Id == "" {
			continue
		}
		req := &v1.SaveSessionReq{
			Id:       s.Id,
			Title:    s.Title,
			Messages: make([]v1.ChatMessage, 0, len(s.Messages)),
		}
		for _, m := range s.Messages {
			req.Messages = append(req.Messages, v1.ChatMessage{
				MsgId:            m.MsgId,
				Content:          m.Content,
				IsUser:           m.IsUser,
				Timestamp:        m.Timestamp,
				ReasoningContent: m.ReasoningContent,
			})
		}
		_, err := c.SaveSession(ctx, userId, req)
		if err != nil {
			g.Log().Warningf(ctx, "merge anonymous session %s failed: %v", s.Id, err)
			// 继续处理其他会话，不因单个失败而中断
		}
	}
	return nil
}
