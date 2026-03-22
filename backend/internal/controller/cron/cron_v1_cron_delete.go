package cron

import (
	"backend/api/cron/v1"
	"backend/internal/logic/cron"
	"backend/internal/logic/knowledge"
	"backend/utility"
	"context"
)

func (c *ControllerV1) CronDelete(ctx context.Context, req *v1.CronDeleteReq) (res *v1.CronDeleteRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err := knowledge.EnsureCronScheduleBelongsToUser(ctx, userUUID, req.ID); err != nil {
		return nil, err
	}
	cronDelete, err := cron.RuCronDelete(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &v1.CronDeleteRes{IsOK: cronDelete}, nil
}
