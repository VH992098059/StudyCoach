package common

import (
	"context"
	"io"
	"time"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/google/uuid"
)

type StreamData struct {
	Id       string             `json:"id"`      // 同一个消息里面的id是相同的
	Created  int64              `json:"created"` // 消息初始生成时间
	Content  string             `json:"content"` // 消息具体内容
	Document []*schema.Document `json:"document"`
}

func SteamResponse(ctx context.Context, streamReader *schema.StreamReader[*schema.Message], docs []*schema.Document) (err error) {
	// 获取HTTP响应对象
	httpReq := ghttp.RequestFromCtx(ctx)
	httpResp := httpReq.Response
	// 设置响应头
	httpResp.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	httpResp.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	httpResp.Header().Set("Pragma", "no-cache")
	httpResp.Header().Set("Expires", "0")
	httpResp.Header().Set("Connection", "keep-alive")
	httpResp.Header().Set("X-Accel-Buffering", "no") // 禁用Nginx缓冲
	httpResp.Header().Set("X-Content-Type-Options", "nosniff")
	httpResp.Header().Set("Access-Control-Allow-Origin", "*")
	httpResp.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	httpResp.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")

	// 立即发送响应头
	httpResp.WriteHeader(200)
	sd := &StreamData{
		Id:      uuid.NewString(),
		Created: time.Now().Unix(),
	}
	if len(docs) > 0 {
		sd.Document = docs
		marshal, _ := sonic.Marshal(sd)
		writeSSEDocuments(httpResp, string(marshal))
	}
	sd.Document = nil // 置空，发一次就够了

	// 用于跟踪已发送的内容长度，实现增量发送
	var fullContent string

	// 处理流式响应
	for {
		chunk, err := streamReader.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			writeSSEError(httpResp, err)
			break
		}
		if len(chunk.Content) == 0 {
			continue
		}

		var contentToSend string

		// 检查chunk.Content是否是累积内容还是增量内容
		if len(chunk.Content) > len(fullContent) && len(fullContent) > 0 {
			// chunk.Content看起来是累积内容，提取增量部分
			if chunk.Content[:len(fullContent)] == fullContent {
				// 确认是累积内容，提取新增部分
				contentToSend = chunk.Content[len(fullContent):]
				fullContent = chunk.Content
			} else {
				// 不是累积内容，直接发送
				contentToSend = chunk.Content
				fullContent += chunk.Content
			}
		} else {
			// 第一次或者chunk.Content是增量内容，直接发送
			contentToSend = chunk.Content
			fullContent += chunk.Content
		}

		// 只有当有内容要发送时才进行JSON序列化和发送
		if len(contentToSend) > 0 {
			sd.Content = contentToSend
			marshal, _ := sonic.Marshal(sd)
			writeSSEData(httpResp, string(marshal))
		}
	}
	// 发送结束事件
	writeSSEDone(httpResp)
	return nil
}

// writeSSEData 写入SSE事件
func writeSSEData(resp *ghttp.Response, data string) {
	if len(data) == 0 {
		return
	}
	// 直接写入，避免fmt.Sprintf的开销
	resp.Write([]byte("data:"))
	resp.Write([]byte(data))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

func writeSSEDone(resp *ghttp.Response) {
	resp.Write([]byte("data:[DONE]\n\n"))
	resp.Flush()
}

func writeSSEDocuments(resp *ghttp.Response, data string) {
	resp.Write([]byte("documents:"))
	resp.Write([]byte(data))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}

// writeSSEError 写入SSE错误
func writeSSEError(resp *ghttp.Response, err error) {
	g.Log().Error(context.Background(), err)
	resp.Write([]byte("event: error\ndata: "))
	resp.Write([]byte(err.Error()))
	resp.Write([]byte("\n\n"))
	resp.Flush()
}
