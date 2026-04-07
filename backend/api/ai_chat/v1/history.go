package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// SaveSessionReq 保存会话请求
type SaveSessionReq struct {
	g.Meta   `path:"/chat/session" method:"post" tags:"AI Chat" summary:"保存会话"`
	Id       string        `json:"id" v:"required" description:"会话ID"`
	Title    string        `json:"title" description:"会话标题"`
	Messages []ChatMessage `json:"messages" description:"消息列表"`
}

type ChatMessage struct {
	Id               int64         `json:"id" description:"消息ID"`
	MsgId            string        `json:"msg_id" description:"前端消息ID"`
	Content          string        `json:"content" description:"消息内容"`
	MultiContent     []MessagePart `json:"multi_content,omitempty" description:"多模态内容"`
	IsUser           bool          `json:"isUser" description:"是否为用户发送"`
	Timestamp        *gtime.Time   `json:"timestamp" description:"发送时间"`
	ReasoningContent string        `json:"reasoningContent,omitempty" description:"思考过程（深度思考模式）"`
}

type SaveSessionRes struct {
	Id string `json:"id" description:"会话ID"`
}

// GetHistoryReq 获取历史会话列表请求
type GetHistoryReq struct {
	g.Meta   `path:"/chat/history" method:"get" tags:"AI Chat" summary:"获取历史会话列表"`
	Page     int `json:"page" v:"min:1" d:"1" description:"页码，默认第1页"`
	PageSize int `json:"page_size" v:"min:1|max:100" d:"20" description:"每页数量，默认20条，最大100条"`
}

type GetHistoryRes struct {
	List     []ChatSession `json:"list" description:"会话列表"`
	Total    int           `json:"total" description:"会话总数"`
	Page     int           `json:"page" description:"当前页码"`
	PageSize int           `json:"page_size" description:"每页数量"`
}

type ChatSession struct {
	Id        string      `json:"id" description:"会话ID"`
	Title     string      `json:"title" description:"会话标题"`
	CreatedAt *gtime.Time `json:"createdAt" description:"创建时间"`
	UpdatedAt *gtime.Time `json:"updatedAt" description:"更新时间"`
}

// GetSessionReq 获取单个会话详情请求
type GetSessionReq struct {
	g.Meta      `path:"/chat/session/:id" method:"get" tags:"AI Chat" summary:"获取单个会话详情"`
	Id          string `json:"id" v:"required" description:"会话ID"`
	BeforeMsgId int64  `json:"before_msg_id" d:"0" description:"起始消息ID，返回小于该ID的消息，用于向上滚动加载，默认0表示从最新消息开始"`
	Limit       int    `json:"limit" v:"min:1|max:200" d:"20" description:"每次加载消息数量，默认20条，最大200条"`
}

type GetSessionRes struct {
	Id        string        `json:"id" description:"会话ID"`
	Title     string        `json:"title" description:"会话标题"`
	Messages  []ChatMessage `json:"messages" description:"消息列表"`
	CreatedAt *gtime.Time   `json:"createdAt" description:"创建时间"`
	UpdatedAt *gtime.Time   `json:"updatedAt" description:"更新时间"`
}

// DeleteSessionReq 删除会话请求
type DeleteSessionReq struct {
	g.Meta `path:"/chat/session/:id" method:"delete" tags:"AI Chat" summary:"删除会话"`
	Id     string `json:"id" v:"required" description:"会话ID"`
}

type DeleteSessionRes struct {
	Id string `json:"id" description:"被删除的会话ID"`
}
