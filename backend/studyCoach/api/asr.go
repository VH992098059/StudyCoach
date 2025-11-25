package api

import (
	"backend/studyCoach/aiModel/asr"
	"backend/studyCoach/common"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"

	// 新增：兼容上游 FastAPI 文件上传格式
	"encoding/base64"
	"mime/multipart"
	"strings"

	"github.com/goccy/go-json"
)

type AsrRequest struct {
	AudioBase64 string `json:"audio_Base64"`
	Language    string `json:"language"`
}

// 兼容多种返回结构：result 可能是对象或数组，同时部分实现会把 text 字段置于顶层
type AsrResultItem struct {
	Key       string `json:"key"`
	RawText   string `json:"raw_text"`
	CleanText string `json:"clean_text"`
	Text      string `json:"text"`
}

type AsrResponseEnvelope struct {
	Result    json.RawMessage `json:"result"`
	RawText   string          `json:"raw_text"`
	CleanText string          `json:"clean_text"`
	Text      string          `json:"text"`
}

func AsrPhone(ctx context.Context, audioBase64 string) (audio []byte, err error) {
	apiURL := "http://localhost:50000" + "/api/v1/asr"

	// 解析 dataURI / 纯Base64
	var mimeType string = "application/octet-stream"
	var payloadBase64 string
	if strings.HasPrefix(audioBase64, "data:") {
		comma := strings.Index(audioBase64, ",")
		if comma < 0 {
			return nil, fmt.Errorf("invalid data URI: missing comma")
		}
		header := audioBase64[:comma]
		payloadBase64 = audioBase64[comma+1:]
		// 提取 mimeType，例如 data:audio/webm;codecs=opus;base64
		mt := strings.TrimPrefix(header, "data:")
		semi := strings.Index(mt, ";")
		if semi > 0 {
			mimeType = mt[:semi]
		} else if mt != "" {
			mimeType = mt
		}
	} else {
		payloadBase64 = audioBase64
	}

	// Base64 解码
	decoded, err := base64.StdEncoding.DecodeString(payloadBase64)
	if err != nil {
		return nil, fmt.Errorf("failed to decode base64: %v", err)
	}

	// 仅支持 torchaudio/soundfile 可识别的格式（WAV/FLAC）。其他格式直接拒绝，避免上游崩溃。
	if !(strings.Contains(mimeType, "wav") || strings.Contains(mimeType, "x-wav") || strings.Contains(mimeType, "flac")) {
		return nil, fmt.Errorf("unsupported audio format: %s; please send 'audio/wav' or 'audio/flac'", mimeType)
	}

	// 推断文件名（用于 multipart）- 只支持 torchaudio 兼容格式
	filename := "audio"
	switch {
	case strings.Contains(mimeType, "wav") || strings.Contains(mimeType, "x-wav"):
		filename += ".wav"
	case strings.Contains(mimeType, "flac"):
		filename += ".flac"
	default:
		// 默认使用 WAV 格式，torchaudio 最佳兼容
		filename += ".wav"
	}

	// 兼容上游 FastAPI: 使用 multipart/form-data，字段名为 files
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	filePart, err := mw.CreateFormFile("files", filename)
	if err != nil {
		return nil, fmt.Errorf("create form file error: %v", err)
	}
	if _, err = filePart.Write(decoded); err != nil {
		return nil, fmt.Errorf("write form file error: %v", err)
	}
	// 语言字段（如上游支持）
	if err = mw.WriteField("language", "auto"); err != nil {
		return nil, fmt.Errorf("write field error: %v", err)
	}
	if err = mw.Close(); err != nil {
		return nil, fmt.Errorf("multipart close error: %v", err)
	}

	// 发起请求
	req, err := http.NewRequest("POST", apiURL, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// 处理响应
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status code %d: %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// 解析响应，兼容 result 为对象或数组的情况
	var env AsrResponseEnvelope
	if err = json.Unmarshal(bodyBytes, &env); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %v; raw=%s", err, string(bodyBytes))
	}

	// 从 result 中提取条目
	var items []AsrResultItem
	if len(env.Result) > 0 {
		rs := strings.TrimSpace(string(env.Result))
		if strings.HasPrefix(rs, "[") {
			_ = json.Unmarshal(env.Result, &items)
		} else if strings.HasPrefix(rs, "{") {
			var one AsrResultItem
			if err := json.Unmarshal(env.Result, &one); err == nil {
				items = []AsrResultItem{one}
			}
		}
	}

	// 提取识别文本（优先 CleanText -> Text -> RawText）
	recognized := ""
	// 先从条目中提取
	for _, it := range items {
		if strings.TrimSpace(it.CleanText) != "" {
			recognized = it.CleanText
			break
		}
		if strings.TrimSpace(it.Text) != "" {
			recognized = it.Text
			break
		}
		if strings.TrimSpace(it.RawText) != "" {
			recognized = it.RawText
			break
		}
	}
	// 如果条目没有，尝试顶层字段
	if strings.TrimSpace(recognized) == "" {
		if strings.TrimSpace(env.CleanText) != "" {
			recognized = env.CleanText
		} else if strings.TrimSpace(env.Text) != "" {
			recognized = env.Text
		} else if strings.TrimSpace(env.RawText) != "" {
			recognized = env.RawText
		}
	}

	if strings.TrimSpace(recognized) == "" {
		return nil, fmt.Errorf("ASR 返回空文本")
	}
	log.Printf("ASR识别结果: %s", recognized)

	// 调用对话模型并进行 TTS
	modelASR, err := asr.BuildaiModelASR(ctx)
	if err != nil {
		return nil, err
	}
	output := common.GetSafeTemplateParams()
	output["question"] = recognized
	invoke, err := modelASR.Invoke(ctx, output)
	if err != nil {
		return nil, err
	}
	speech, err := TextToSpeech(ctx, invoke.Content)
	if err != nil {
		return nil, err
	}
	return speech, nil
}
