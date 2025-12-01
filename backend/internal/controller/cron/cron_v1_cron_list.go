package cron

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronList(ctx context.Context, req *v1.CronListReq) (res *v1.CronListRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
