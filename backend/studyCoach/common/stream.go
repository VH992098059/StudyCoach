package common

import (
	"context"
	"io"
	"strings"
	"time"

	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/google/uuid"
)

// reasoningChunkSize 思考内容模拟流式时每段最大字符数（按 rune 计，避免截断中文）
const reasoningChunkSize = 4

// reasoningChunkIntervalMs 思考内容每段之间的间隔（毫秒）
const reasoningChunkIntervalMs = 35

// contentChunkSize 回答内容模拟流式时每段最大字符数
const contentChunkSize = 6

// contentChunkIntervalMs 回答内容每段之间的间隔（毫秒）
const contentChunkIntervalMs = 25

type StreamData struct {
	Id               string             `json:"id"`                // 同一个消息里面的id是相同的
	Created          int64              `json:"created"`           // 消息初始生成时间
	Content          string             `json:"content"`           // 消息具体内容
	ReasoningContent string             `json:"reasoning_content"` // 思考过程（深度思考模式）
	Document         []*schema.Document `json:"document"`
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
	var fullReasoning string

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

		hasContent := len(chunk.Content) > 0
		hasReasoning := len(chunk.ReasoningContent) > 0
		if !hasContent && !hasReasoning {
			continue
		}

		var contentToSend string
		var reasoningToSend string

		// 处理 Content（与原有逻辑一致）
		if hasContent {
			if len(chunk.Content) > len(fullContent) && len(fullContent) > 0 {
				if chunk.Content[:len(fullContent)] == fullContent {
					contentToSend = chunk.Content[len(fullContent):]
					fullContent = chunk.Content
				} else {
					contentToSend = chunk.Content
					fullContent += chunk.Content
				}
			} else {
				contentToSend = chunk.Content
				fullContent += chunk.Content
			}
		}

		// 处理 ReasoningContent（思考过程，流式增量）
		if hasReasoning {
			if len(chunk.ReasoningContent) > len(fullReasoning) && len(fullReasoning) > 0 {
				if chunk.ReasoningContent[:len(fullReasoning)] == fullReasoning {
					reasoningToSend = chunk.ReasoningContent[len(fullReasoning):]
					fullReasoning = chunk.ReasoningContent
				} else {
					reasoningToSend = chunk.ReasoningContent
					fullReasoning += chunk.ReasoningContent
				}
			} else {
				reasoningToSend = chunk.ReasoningContent
				fullReasoning += chunk.ReasoningContent
			}
		}

		// 回答内容：拆成小段模拟流式输出（与思考过程一致）
		if len(contentToSend) > 0 {
			sendContentStreamed(httpResp, sd, contentToSend)
		}

		// 思考过程：拆成小段模拟流式输出
		if len(reasoningToSend) > 0 {
			sendReasoningStreamed(httpResp, sd, reasoningToSend)
		}
	}
	// 兜底：若最终内容以「正在...」类过渡句结尾，说明模型可能在工具调用后返回空，追加友好提示
	if fullContent != "" {
		trimmed := strings.TrimSpace(fullContent)
		endsWithEllipsis := strings.HasSuffix(trimmed, "...") || strings.HasSuffix(trimmed, "…")
		hasTransition := strings.Contains(trimmed, "正在检查") || strings.Contains(trimmed, "正在保存") || strings.Contains(trimmed, "让我检查")
		if endsWithEllipsis && hasTransition {
			sendContentStreamed(httpResp, sd, "处理已完成，可继续对话。")
			g.Log().Infof(context.Background(), "[Stream] 检测到工具过渡句后流结束，已追加兜底提示")
		}
	}
	// 发送结束事件
	writeSSEDone(httpResp)
	return nil
}

// sendContentStreamed 将回答内容拆成小段逐段发送，模拟流式效果
func sendContentStreamed(resp *ghttp.Response, sd *StreamData, content string) {
	runes := []rune(content)
	for i := 0; i < len(runes); i += contentChunkSize {
		end := i + contentChunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunk := string(runes[i:end])
		sd.Content = chunk
		sd.ReasoningContent = ""
		marshal, _ := sonic.Marshal(sd)
		writeSSEData(resp, string(marshal))
		resp.Flush()
		if contentChunkIntervalMs > 0 {
			time.Sleep(time.Duration(contentChunkIntervalMs) * time.Millisecond)
		}
	}
}

// sendReasoningStreamed 将思考内容拆成小段逐段发送，模拟流式效果
// 火山 Ark 可能一次性返回完整 reasoning_content，此处按字符拆分并发送
func sendReasoningStreamed(resp *ghttp.Response, sd *StreamData, reasoning string) {
	runes := []rune(reasoning)
	for i := 0; i < len(runes); i += reasoningChunkSize {
		end := i + reasoningChunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunk := string(runes[i:end])
		sd.ReasoningContent = chunk
		sd.Content = ""
		marshal, _ := sonic.Marshal(sd)
		writeSSEData(resp, string(marshal))
		resp.Flush()
		// 每段后都加间隔，保证可见的流式效果（包括上游已分小段的情况）
		if reasoningChunkIntervalMs > 0 {
			time.Sleep(time.Duration(reasoningChunkIntervalMs) * time.Millisecond)
		}
	}
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
