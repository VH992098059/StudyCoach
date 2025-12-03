package cron

import (
	"backend/internal/logic/cron"
	"context"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronList(ctx context.Context, req *v1.CronListReq) (res *v1.CronListRes, err error) {
	list, err := cron.RuCronList(ctx, req.Page, req.Size)
	if err != nil {
		return nil, err
	}
	return &v1.CronListRes{List: list}, nil
}
