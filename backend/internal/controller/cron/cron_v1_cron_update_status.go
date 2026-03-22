package cron

import (
	"backend/api/cron/v1"
	"backend/internal/logic/cron"
	"backend/internal/logic/knowledge"
	"backend/utility"
	"context"
)

func (c *ControllerV1) CronUpdateStatus(ctx context.Context, req *v1.CronUpdateStatusReq) (res *v1.CronUpdateStatusRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err := knowledge.EnsureCronScheduleBelongsToUser(ctx, userUUID, req.Id); err != nil {
		return nil, err
	}
	status, err := cron.RuCronUpdateStatus(ctx, req.Id, req.Status)
	if err != nil {
		return nil, err
	}
	return &v1.CronUpdateStatusRes{IsOK: status}, nil
}
