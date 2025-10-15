package api

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/goccy/go-json"
)

type AsrRequest struct {
	AudioBase64 string `json:"audio_Base64"`
	Language    string `json:"language"`
}
type AsrResponse struct {
	Result struct {
		RawText   string `json:"raw_text"`
		CleanText string `json:"clean_text"`
		Text      string `json:"text"`
	} `json:"result"`
}

func AsrPhone(audioBase64 string) (audio []byte, err error) {
	apiURL := "http://localhost:50001" + "/api/v2/asr_base64"
	payLoad := AsrRequest{
		AudioBase64: audioBase64,
		Language:    "auto",
	}
	jsonData, err := json.Marshal(payLoad)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %v", err)
	}
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/plain")
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
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}
	var asrResp AsrResponse
	if err := json.Unmarshal(bodyBytes, &asrResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %v; raw=%s", err, string(bodyBytes))
	}
	log.Printf("raw_text=%s, clean_text=%s, text=%s",
		asrResp.Result.RawText, asrResp.Result.CleanText, asrResp.Result.Text)
	return
}
