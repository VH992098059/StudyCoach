package cron_execute

import (
	"backend/internal/logic/cron_execute"
	"backend/internal/model/entity"
	"context"

	"backend/api/cron_execute/v1"
)

func (c *ControllerV1) CronExecuteCreate(ctx context.Context, req *v1.CronExecuteCreateReq) (res *v1.CronExecuteCreateRes, err error) {
	create, err := cron_execute.CronExecuteLogicCreate(ctx, &entity.CronExecute{
		CronNameFk:  req.CronNameFk,
		ExecuteTime: req.ExecuteTime,
	})
	if err != nil {
		return nil, err
	}
	return &v1.CronExecuteCreateRes{Id: create}, nil
}
