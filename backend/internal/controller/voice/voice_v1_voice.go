package voice

import (
	"backend/api/voice/v1"
	"backend/studyCoach/api"
	"context"

	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) Voice(ctx context.Context, req *v1.VoiceReq) (res *v1.VoiceRes, err error) {
	speech, err := api.TextToSpeech(ctx, req.Input)
	if err != nil {
		return nil, err
	}

	// 直接写入音频数据到响应
	r := g.RequestFromCtx(ctx)
	r.Response.Header().Set("Content-Type", "audio/mpeg")
	r.Response.Write(speech)

	return &v1.VoiceRes{}, nil
}
