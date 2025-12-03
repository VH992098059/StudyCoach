package cron

import (
	"backend/internal/logic/cron"
	"context"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronUpdateStatus(ctx context.Context, req *v1.CronUpdateStatusReq) (res *v1.CronUpdateStatusRes, err error) {
	status, err := cron.RuCronUpdateStatus(ctx, req.Id, req.Status)
	if err != nil {
		return nil, err
	}
	return &v1.CronUpdateStatusRes{IsOK: status}, nil
}
