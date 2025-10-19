package main

/*type TTSRequest struct {
	Text string `json:"text"`
	//Voice        string  `json:"voice,omitempty"`
	LengthScale float64 `json:"length_scale,omitempty"`
	NoiseScale  float64 `json:"noise_scale,omitempty"`
	NoiseW      float64 `json:"noise_w_scale,omitempty"`
}

func main() {
	// Piper 服务器的地址
	piperURL := "http://localhost:5000"
	// 要转换的文本
	textToSpeak := "你好，这是Go语音客户端"
	// 输出的音频文件名
	outputFilename := "output_from_go.wav"
	requestData := TTSRequest{
		Text:        textToSpeak,
		LengthScale: 1.2,
		NoiseScale:  1.0,
		NoiseW:      0.8,
	}
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return
	}
	// 打印将要发送的 JSON，方便调试
	fmt.Printf("将要发送的 JSON 数据: %s\n", string(jsonData))
	reqBody := bytes.NewBuffer(jsonData)
	resp, err := http.Post(piperURL, "application/json", reqBody)
	if err != nil {
		fmt.Printf("发送 POST 请求失败: %v\n", err)
		fmt.Println("请确保 Piper HTTP 服务器正在运行。")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		all, _ := io.ReadAll(resp.Body)
		fmt.Println("服务器错误:", resp.StatusCode)
		fmt.Println("错误信息:", string(all))
	}
	outputFile, err := os.Create(outputFilename)
	if err != nil {
		return
	}
	defer outputFile.Close()
	_, err = io.Copy(outputFile, resp.Body)
	if err != nil {
		return
	}
	fmt.Printf("成功！语音已保存到文件: %s\n", outputFilename)
}*/
