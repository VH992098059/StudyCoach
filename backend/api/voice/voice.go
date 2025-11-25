// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package voice

import (
	"context"

	"backend/api/voice/v1"
)

type IVoiceV1 interface {
	Voice(ctx context.Context, req *v1.VoiceReq) (res *v1.VoiceRes, err error)
	Asr(ctx context.Context, req *v1.AsrReq) (res *v1.AsrRes, err error)
}
