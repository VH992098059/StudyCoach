package gorm

import "time"

// ChatMessages 聊天消息表
type ChatMessages struct {
	ID               string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"` // 主键（UUID）
	SessionUUID      string    `gorm:"column:session_uuid;type:uuid;index"`            // 所属会话 UUID（chat_sessions.id）
	MsgID            string    `gorm:"column:msg_id;type:varchar(255);index"`          // 消息唯一 ID
	Content          string    `gorm:"column:content;type:text"`                       // 消息内容
	MultiContent     string    `gorm:"column:multi_content;type:json"`                 // 多模态内容（JSON），使用指针避免空字符串
	IsUser           int       `gorm:"column:is_user;type:smallint;default:0"`         // 是否用户消息：0 否（AI），1 是
	Timestamp        time.Time `gorm:"column:timestamp;type:timestamp"`                // 消息时间戳
	ReasoningContent string    `gorm:"column:reasoning_content;type:text"`             // 思考过程（深度思考模式）
}

func (ChatMessages) TableName() string {
	return "chat_messages"
}
