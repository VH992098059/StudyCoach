package cron_execute

import (
	"context"

	"backend/api/cron_execute/v1"
	"backend/internal/logic/cron_execute"
)

func (c *ControllerV1) CronExecuteListByCronId(ctx context.Context, req *v1.CronExecuteListByCronIdReq) (res *v1.CronExecuteListByCronIdRes, err error) {
	list, total, err := cron_execute.RuCronExecuteListByCronId(ctx, req.CronId, req.Page, req.Size)
	if err != nil {
		return nil, err
	}
	return &v1.CronExecuteListByCronIdRes{
		List:  list,
		Total: total,
	}, nil
}
