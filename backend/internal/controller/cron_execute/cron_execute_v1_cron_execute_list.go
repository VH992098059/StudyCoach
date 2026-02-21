package cron_execute

import (
	"context"

	"backend/api/cron_execute/v1"
	"backend/internal/logic/cron_execute"
)

func (c *ControllerV1) CronExecuteList(ctx context.Context, req *v1.CronExecuteListReq) (res *v1.CronExecuteListRes, err error) {
	list, total, err := cron_execute.RuCronExecuteList(ctx, req.CronNameFk, req.Page, req.Size)
	if err != nil {
		return nil, err
	}
	return &v1.CronExecuteListRes{
		List:  list,
		Total: total,
	}, nil
}
