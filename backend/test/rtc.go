package main

import (
    "fmt"
    "log"
    "net/http"
    "sync"

    "github.com/gorilla/websocket"
    "github.com/pion/webrtc/v4"
)

//升级配置
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Signal struct {
	Type      string                    `json:"type"`
	SDP       webrtc.SessionDescription `json:"sdp"`
	Candidate webrtc.ICECandidateInit   `json:"candidate"`
}

func main() {
    m := &webrtc.MediaEngine{}
    if err := m.RegisterDefaultCodecs(); err != nil {
        panic(err)
    }
    api := webrtc.NewAPI(webrtc.WithMediaEngine(m))
    http.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
        // 将 HTTP 请求升级为 WebSocket 连接
        ws, err := upgrader.Upgrade(writer, request, nil)
        if err != nil {
            log.Fatal(err)
        }
        defer ws.Close()

        //创建PeerConnection
        peerConnection, err := api.NewPeerConnection(webrtc.Configuration{})
        if err != nil {
            log.Fatal(err)
        }
        defer peerConnection.Close()

        //安全写入WebSocket
        var writeLock sync.Mutex
        sendSignal := func(signal Signal) {
            writeLock.Lock()
            defer writeLock.Unlock()
            if err = ws.WriteJSON(signal); err != nil {
                log.Println(err)
            }
        }
        // 提前创建本地音频轨道并添加到连接中（参与首轮协商）
        localTrack, newTrackErr := webrtc.NewTrackLocalStaticRTP(
            webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus},
            "audio", "pion",
        )
        if newTrackErr != nil {
            log.Println("create local track error:", newTrackErr)
            return
        }
        rtpSender, addTrackErr := peerConnection.AddTrack(localTrack)
        if addTrackErr != nil {
            log.Println("add local track error:", addTrackErr)
            return
        }

        // 读取 RTCP 以保持连接（避免阻塞）
        go func() {
            rtcpBuf := make([]byte, 1500)
            for {
                if _, _, rtcpErr := rtpSender.Read(rtcpBuf); rtcpErr != nil {
                    return
                }
            }
        }()

        // 设置 ICE 状态变化日志
        peerConnection.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
            fmt.Printf("ICE Connection State: %s\n", state.String())
        })

        //设置OnICECandidate回显函数
        peerConnection.OnICECandidate(func(candidate *webrtc.ICECandidate) {
            if candidate == nil {
                return
            }
            //讲Candidate发送给浏览器端
            sendSignal(Signal{
                Type:      "candidate",
                Candidate: candidate.ToJSON(),
            })
        })

        //设置OnTrack回调函数：将远端音频 RTP 写回到预创建的本地音轨，实现回声
        peerConnection.OnTrack(func(track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
            fmt.Printf("Track received: kind=%s, id=%s\n", track.Kind(), track.ID())
            if track.Kind() != webrtc.RTPCodecTypeAudio {
                log.Println("non-audio track, ignoring")
                return
            }
            rtpBuf := make([]byte, 1500)
            var totalBytes uint64
            for {
                i, _, readErr := track.Read(rtpBuf)
                if readErr != nil {
                    log.Println("read remote track error:", readErr)
                    return
                }
                totalBytes += uint64(i)
                if _, writeErr := localTrack.Write(rtpBuf[:i]); writeErr != nil {
                    log.Println("write local track error:", writeErr)
                    return
                }
                // 简单的吞吐日志，帮助确认是否在持续转发音频
                if totalBytes > 512*1024 { // 每累计 512KB 打印一次
                    log.Printf("echoed audio bytes: %d\n", totalBytes)
                    totalBytes = 0
                }
            }
        })

        //循环读取WebSocket消息
        for {
            var signal Signal
            if err = ws.ReadJSON(&signal); err != nil {
                log.Println(err)
                return
            }
            switch signal.Type {
            case "offer":
                //收到Offer，设置远端描述
                if err = peerConnection.SetRemoteDescription(signal.SDP); err != nil {
                    log.Println(err)
                    return
                }
                answer, err := peerConnection.CreateAnswer(nil)
                if err != nil {
                    log.Println(err)
                    return
                }
                if err = peerConnection.SetLocalDescription(answer); err != nil {
                    log.Println(err)
                    return
                }

                //将Answer发回给浏览器
                sendSignal(Signal{Type: "answer", SDP: answer})
            case "candidate":
                // 收到浏览器的ICE Candidate，添加到 PeerConnection
                if err = peerConnection.AddICECandidate(signal.Candidate); err != nil {
                    log.Println(err)
                    return
                }
            }
        }
    })
    fmt.Println("Server started on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
