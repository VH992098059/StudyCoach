package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin:     func(r *http.Request) bool { return true },
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// WsMessage 客户端消息结构
type WsMessage struct {
	Type    string `json:"type"`
	Token   string `json:"token,omitempty"`
	Payload any    `json:"payload,omitempty"`
}

// HandleWebSocket 处理 WebSocket 连接，需传入 Hub（使用 gorilla/websocket，非弃用 API）
func HandleWebSocket(hub *Hub) func(r *ghttp.Request) {
	return func(r *ghttp.Request) {
		conn, err := upgrader.Upgrade(r.Response.RawWriter(), r.Request, nil)
		if err != nil {
			g.Log().Error(r.Context(), "WebSocket upgrade failed:", err)
			r.Exit()
			return
		}
		client := &Client{
			Hub:       hub,
			Conn:      conn,
			Send:      make(chan []byte, 256),
			Remote:    r.RemoteAddr,
			UserAgent: r.Header.Get("User-Agent"),
		}
		client.Hub.register <- client

		// 发送欢迎消息
		_ = sendJSON(client.Conn, map[string]any{"type": "ready", "status": "connected"})

		// 启动写协程
		go client.writePump()

		// 读循环
		client.readPump(r.Context())
	}
}

func (c *Client) readPump(ctx context.Context) {
	defer func() {
		c.Hub.unregister <- c
		_ = c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg WsMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			// 兼容纯文本 ping
			if string(message) == "ping" {
				_ = sendJSON(c.Conn, map[string]any{"type": "pong"})
			}
			continue
		}

		switch msg.Type {
		case "ping":
			_ = sendJSON(c.Conn, map[string]any{"type": "pong"})
		case "auth":
			// 鉴权：校验 token，后续可扩展按用户推送
			if msg.Token != "" {
				// 可选：校验 JWT，将 userID 存入 client
				_ = sendJSON(c.Conn, map[string]any{"type": "auth_ok"})
			}
		default:
			log.Printf("[WS] Unknown message type: %s", msg.Type)
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		_ = c.Conn.Close()
	}()

	for message := range c.Send {
		if err := c.Conn.WriteMessage(1, message); err != nil {
			return
		}
	}
}

func sendJSON(conn interface {
	WriteMessage(messageType int, data []byte) error
}, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return conn.WriteMessage(1, data)
}
