package cron

import (
	"backend/internal/logic/cron"
	"context"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronDelete(ctx context.Context, req *v1.CronDeleteReq) (res *v1.CronDeleteRes, err error) {
	cronDelete, err := cron.RuCronDelete(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &v1.CronDeleteRes{IsOK: cronDelete}, nil
}
