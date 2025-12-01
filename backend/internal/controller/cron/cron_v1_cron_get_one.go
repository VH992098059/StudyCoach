package cron

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronGetOne(ctx context.Context, req *v1.CronGetOneReq) (res *v1.CronGetOneRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
