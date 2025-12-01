package cron

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronCreate(ctx context.Context, req *v1.CronCreateReq) (res *v1.CronCreateRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
