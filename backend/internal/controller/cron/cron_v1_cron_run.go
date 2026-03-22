package cron

import (
	"context"

	v1 "backend/api/cron/v1"
	"backend/internal/logic/cron"
	"backend/internal/logic/knowledge"
	"backend/utility"
)

func (c *ControllerV1) CronRun(ctx context.Context, req *v1.CronRunReq) (res *v1.CronRunRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err := knowledge.EnsureCronScheduleBelongsToUser(ctx, userUUID, req.Id); err != nil {
		return nil, err
	}
	run, err := cron.RuCronRun(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &v1.CronRunRes{IsOK: run}, nil
}
