package voice

import (
	"backend/studyCoach/api"
	"context"

	"github.com/gogf/gf/v2/frame/g"

	"backend/api/voice/v1"
)

func (c *ControllerV1) Asr(ctx context.Context, req *v1.AsrReq) (res *v1.AsrRes, err error) {
	phone, err := api.AsrPhone(ctx, req.AudioBase64)
	if err != nil {
		return nil, err
	}
	r := g.RequestFromCtx(ctx)
	r.Response.Header().Set("Content-Type", "audio/mpeg")
	r.Response.Write(phone)
	return
}
