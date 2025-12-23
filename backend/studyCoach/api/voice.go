package api

import (
	"backend/utility"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
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
	baseURL := g.Cfg().MustGet(ctx, "siliconflow.baseURL").String()
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
	apiKey := g.Cfg().MustGet(ctx, "voice.apiKey").String()
	if apiKey == "" {
		return nil, fmt.Errorf("API key not found in configuration")
	}

	// 正确设置请求头
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "audio/mpeg")

	//请求处理
	audioData, err := utility.AsrTTSHttp(req)
	if err != nil {
		return nil, err
	}
	fmt.Println("语音合成成功")
	return audioData, nil
}
