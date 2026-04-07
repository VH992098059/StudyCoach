package cron_execute

import (
	"context"

	"backend/api/cron_execute/v1"
	"backend/internal/logic/cron_execute"
)

func (c *ControllerV1) CronExecuteDetail(ctx context.Context, req *v1.CronExecuteDetailReq) (res *v1.CronExecuteDetailRes, err error) {
	detail, err := cron_execute.RuCronExecuteDetail(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &v1.CronExecuteDetailRes{
		CronExecute: *detail,
	}, nil
}
