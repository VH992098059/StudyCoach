package main

/*// RequestPayload 结构体定义了发送到 API 的请求体
type RequestPayload struct {
	Model  string  `json:"model"`
	Input  string  `json:"input"`
	Voice  string  `json:"voice,omitempty"` // omitempty 表示如果该字段为空，则在JSON中忽略
	Speed  float64 `json:"speed,omitempty"`
	Format string  `json:"response_format,omitempty"`
}

func main() {
	apiKey := "sk-xsozofrlbofcvbxabfpqcybqnhjmlzuztbxotnqyzurdzgaz"
	apiUrl := "https://api.siliconflow.cn/v1/audio/speech"
	payload := RequestPayload{
		Model:  "FunAudioLLM/CosyVoice2-0.5B",
		Input:  "你好，你是谁",
		Voice:  "FunAudioLLM/CosyVoice2-0.5B:alex",
		Speed:  1.0,
		Format: "mp3",
	}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Errorf("%v\n", err)
		return
	}
	req, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Errorf("%v\n", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "audio/mpeg")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()
	// 6. 处理响应
	if resp.StatusCode != http.StatusOK {
		// 如果状态码不是 200 OK，则读取错误信息
		bodyBytes, _ := io.ReadAll(resp.Body)
		fmt.Printf("API request failed with status code %d: %s\n", resp.StatusCode, string(bodyBytes))
		return
	}
	outputFile, err := os.Create("output.mp3")
	if err != nil {
		return
	}
	defer outputFile.Close()

	_, err = io.Copy(outputFile, resp.Body)
	if err != nil {
		fmt.Printf("Error saving audio to file: %v\n", err)
		return
	}
	fmt.Println("语音合成成功，已保存为 output.mp3")
}
*/
