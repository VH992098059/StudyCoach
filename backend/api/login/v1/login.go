package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// AnonymousSessionPayload 未登录时的会话数据，登录时合并到用户历史
type AnonymousSessionPayload struct {
	Id       string        `json:"id" description:"会话ID"`
	Title    string        `json:"title" description:"会话标题"`
	Messages []ChatMessage `json:"messages" description:"消息列表"`
}

// ChatMessage 聊天消息（与 ai_chat 保持一致）
type ChatMessage struct {
	Id        int64       `json:"id" description:"消息ID"`
	MsgId     string      `json:"msg_id" description:"前端消息ID"`
	Content   string      `json:"content" description:"消息内容"`
	IsUser    bool        `json:"isUser" description:"是否为用户发送"`
	Timestamp *gtime.Time `json:"timestamp" description:"发送时间"`
}

type LoginReq struct {
	g.Meta            `path:"users/login" method:"post" sm:"登录"`
	Username          string                    `json:"username" v:"required|length:6,30"`
	Password          string                    `json:"password" v:"required|length:6,20"`
	AnonymousSessions []AnonymousSessionPayload `json:"anonymousSessions" description:"未登录时的会话，登录后合并到用户历史"`
}
type LoginRes struct {
	g.Meta `mime:"application/json"`
	Id     uint64 `json:"id"`
	Uuid   string `json:"uuid"`
	Token  string `json:"token" dc:"在需要鉴权的接口中header加入Authorization: token"`
}
type RegisterReq struct {
	g.Meta   `path:"users/register" method:"post" sm:"注册"`
	Username string `json:"username" v:"required|length:6,30"`
	Password string `json:"password" v:"required|length:6,20"`
	Email    string `json:"email" v:"required|length:6,30"`
}
type RegisterRes struct {
	g.Meta `mime:"application/json"`
	Id     int64 `json:"id"`
}

type LogoutReq struct {
	g.Meta `path:"users/logout" method:"post" sm:"退出登录"`
}
type LogoutRes struct {
	Msg string `json:"msg"`
}

type UpdatePasswordReq struct {
	g.Meta      `path:"users/update_password" method:"post" sm:"修改密码"`
	OldPassword string `json:"oldPassword" v:"required|length:6,20"`
	NewPassword string `json:"newPassword" v:"required|length:6,20"`
}
type UpdatePasswordRes struct {
	g.Meta `mime:"application/json"`
	Msg    string `json:"msg"`
}
