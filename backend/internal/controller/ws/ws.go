package ws

import (
	"net/http"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func WsHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		gerror.NewCode(gcode.New(500, err.Error(), ""))
		return
	}
	defer ws.Close()
	// → 发送欢迎包或鉴权信息
	// ← 监听来自前端的启动/心跳/其他指令
	for {
		msgType, msg, err := ws.ReadMessage()
		if err != nil {
			break // 断线或错误
		}
		switch string(msg) {
		case "start":
			ws.WriteMessage(msgType, []byte(`{"status":"ready"}`))
		case "ping":
			ws.WriteMessage(msgType, []byte(`pong`))
		}
	}

}
