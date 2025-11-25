package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gogf/gf/v2/frame/g"
)

type RequestPayload struct {
	Model  string  `json:"model"`
	Input  string  `json:"input"`
	Voice  string  `json:"voice"`
	Speed  float64 `json:"speed"`
	Format string  `json:"format"`
}

func TextToSpeech(ctx context.Context, input string) ([]byte, error) {
	// 从配置文件获取基础URL
	baseURL := g.Cfg().MustGet(ctx, "chat.baseURL").String()
	if baseURL == "" {
		return nil, fmt.Errorf("base URL not found in configuration")
	}
	apiUrl := baseURL + "/audio/speech"
	payload := RequestPayload{
		Model:  "FunAudioLLM/CosyVoice2-0.5B",
		Input:  input,
		Voice:  "FunAudioLLM/CosyVoice2-0.5B:alex",
		Speed:  1.0,
		Format: "mp3",
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %v", err)
	}
	req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// 获取API密钥
	apiKey := g.Cfg().MustGet(ctx, "chat.apiKey").String()
	if apiKey == "" {
		return nil, fmt.Errorf("API key not found in configuration")
	}

	// 正确设置请求头
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "audio/mpeg")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// 处理响应
	if resp.StatusCode != http.StatusOK {
		// 如果状态码不是 200 OK，则读取错误信息
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status code %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// 直接读取音频数据到内存
	audioData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading audio data: %v", err)
	}
	fmt.Println("语音合成成功")
	return audioData, nil
}
