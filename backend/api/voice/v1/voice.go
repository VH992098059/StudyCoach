package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

type VoiceReq struct {
	g.Meta `path:"/tts" method:"post"`
	Input  string `json:"input" v:"required"`
}
type VoiceRes struct {
	g.Meta `mime:"audio/mpeg"`
}
type AsrReq struct {
	g.Meta      `path:"/asr" method:"post"`
	AudioBase64 string `json:"audio_base64" v:"required"`
	Language    string `json:"language" d:"auto"`
}
type AsrResult struct {
	RawText   string `json:"raw_text"`
	CleanText string `json:"clean_text"`
	Text      string `json:"text"`
}
type AsrRes struct {
	g.Meta `mime:"audio/mpeg"`
}
