package cron

import (
	"context"

	v1 "backend/api/cron/v1"
	"backend/internal/logic/cron"
)

func (c *ControllerV1) CronRun(ctx context.Context, req *v1.CronRunReq) (res *v1.CronRunRes, err error) {
	run, err := cron.RuCronRun(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &v1.CronRunRes{IsOK: run}, nil
}
