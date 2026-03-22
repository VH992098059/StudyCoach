package ws

import (
	"encoding/json"
	"log"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

func truncateForLog(s string, max int) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "(empty)"
	}
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max]) + "…"
}

// Client 表示一个 WebSocket 连接
type Client struct {
	Hub       *Hub
	Conn      *websocket.Conn
	Send      chan []byte
	Remote    string // 客户端地址（TCP 层）
	UserAgent string // 请求头 User-Agent（截断记入日志）
}

// Hub 管理所有 WebSocket 连接，支持广播
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// NewHub 创建 Hub 实例
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run 启动 Hub，处理注册、注销和广播
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			n := len(h.clients)
			h.mu.Unlock()
			log.Printf("[WS] Client connected remote=%s ua=%s total=%d", client.Remote, truncateForLog(client.UserAgent, 120), n)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			n := len(h.clients)
			h.mu.Unlock()
			log.Printf("[WS] Client disconnected remote=%s ua=%s total=%d", client.Remote, truncateForLog(client.UserAgent, 120), n)

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					// 发送缓冲区满，关闭连接
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastJSON 广播 JSON 消息
func (h *Hub) BroadcastJSON(v any) {
	data, err := json.Marshal(v)
	if err != nil {
		log.Printf("[WS] BroadcastJSON marshal error: %v", err)
		return
	}
	select {
	case h.broadcast <- data:
	default:
		log.Printf("[WS] Broadcast channel full, drop message")
	}
}

// BroadcastCronComplete 广播定时任务完成通知
func (h *Hub) BroadcastCronComplete(cronID int64, cronName string, success bool) {
	h.BroadcastJSON(map[string]any{
		"type": "cron_complete",
		"payload": map[string]any{
			"cron_id":   cronID,
			"cron_name": cronName,
			"success":   success,
		},
	})
}

// ClientCount 返回当前连接数
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

// DefaultHub 全局 Hub 实例，由 cmd 初始化，供 api 层广播
var DefaultHub *Hub

// BroadcastCronCompleteGlobal 使用 DefaultHub 广播定时任务完成（供 api 层调用）
func BroadcastCronCompleteGlobal(cronID int64, cronName string, success bool) {
	if DefaultHub != nil {
		DefaultHub.BroadcastCronComplete(cronID, cronName, success)
	}
}
