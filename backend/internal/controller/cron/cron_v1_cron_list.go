package cron

import (
	"backend/api/cron/v1"
	"backend/internal/logic/cron"
	"backend/utility"
	"context"
)

func (c *ControllerV1) CronList(ctx context.Context, req *v1.CronListReq) (res *v1.CronListRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	list, err := cron.RuCronList(ctx, userUUID, req.Page, req.Size)
	if err != nil {
		return nil, err
	}
	return &v1.CronListRes{List: list}, nil
}
