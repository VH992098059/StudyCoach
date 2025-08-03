package common

import (
	"context"
	"fmt"
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
	httpResp.Header().Set("Content-Type", "text/event-stream")
	httpResp.Header().Set("Cache-Control", "no-cache")
	httpResp.Header().Set("Connection", "keep-alive")
	httpResp.Header().Set("X-Accel-Buffering", "no") // 禁用Nginx缓冲
	httpResp.Header().Set("Access-Control-Allow-Origin", "*")
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
	var sentLength int
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

		// 添加详细日志来观察chunk.Content的内容
		g.Log().Infof(ctx, "Received chunk content: '%s', length: %d", chunk.Content, len(chunk.Content))
		g.Log().Infof(ctx, "Current fullContent: '%s', sentLength: %d", fullContent, sentLength)

		// 检查chunk.Content是否是累积内容还是增量内容
		if len(chunk.Content) > len(fullContent) && len(fullContent) > 0 {
			// chunk.Content看起来是累积内容，提取增量部分
			if chunk.Content[:len(fullContent)] == fullContent {
				// 确认是累积内容，提取新增部分
				incrementalContent := chunk.Content[len(fullContent):]
				g.Log().Infof(ctx, "Detected cumulative content, sending incremental: '%s'", incrementalContent)

				sd.Content = incrementalContent
				marshal, _ := sonic.Marshal(sd)
				writeSSEData(httpResp, string(marshal))

				fullContent = chunk.Content
			} else {
				// 不是累积内容，直接发送
				g.Log().Infof(ctx, "Sending full chunk content: '%s'", chunk.Content)
				sd.Content = chunk.Content
				marshal, _ := sonic.Marshal(sd)
				writeSSEData(httpResp, string(marshal))

				fullContent += chunk.Content
			}
		} else {
			// 第一次或者chunk.Content是增量内容，直接发送
			g.Log().Infof(ctx, "Sending chunk content (first or incremental): '%s'", chunk.Content)
			sd.Content = chunk.Content
			marshal, _ := sonic.Marshal(sd)
			writeSSEData(httpResp, string(marshal))

			fullContent += chunk.Content
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
	// g.Log().Infof(context.Background(), "data: %s", data)
	resp.Writeln(fmt.Sprintf("data:%s\n", data))
	resp.Flush()
}

func writeSSEDone(resp *ghttp.Response) {
	resp.Writeln(fmt.Sprintf("data:%s\n", "[DONE]"))
	resp.Flush()
}

func writeSSEDocuments(resp *ghttp.Response, data string) {
	resp.Writeln(fmt.Sprintf("documents:%s\n", data))
	resp.Flush()
}

// writeSSEError 写入SSE错误
func writeSSEError(resp *ghttp.Response, err error) {
	g.Log().Error(context.Background(), err)
	resp.Writeln(fmt.Sprintf("event: error\ndata: %s\n\n", err.Error()))
	resp.Flush()
}
