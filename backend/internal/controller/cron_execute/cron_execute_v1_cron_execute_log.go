package cron_execute

import (
	"context"

	"backend/api/cron_execute/v1"
	"backend/internal/logic/cron_execute"
)

func (c *ControllerV1) CronExecuteLog(ctx context.Context, req *v1.CronExecuteLogReq) (res *v1.CronExecuteLogRes, err error) {
	list, total, err := cron_execute.RuCronExecuteLog(ctx, req.ExecuteId, req.Page, req.Size)
	if err != nil {
		return nil, err
	}
	return &v1.CronExecuteLogRes{
		List:  list,
		Total: total,
	}, nil
}
