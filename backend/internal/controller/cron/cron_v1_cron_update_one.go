package cron

import (
	"backend/internal/logic/cron"
	"backend/internal/model/entity"
	"context"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronUpdateOne(ctx context.Context, req *v1.CronUpdateOneReq) (res *v1.CronUpdateOneRes, err error) {
	update, err := cron.RuCronUpdate(ctx, &entity.KnowledgeBaseCronSchedule{
		Id:                int(req.Id),
		CronName:          req.CronName,
		CronExpression:    req.CronExpression,
		SchedulingMethod:  req.SchedulingMethod,
		ContentType:       int(req.ContentType),
		Status:            int(req.Status),
		KnowledgeBaseName: req.KnowledgeBaseName,
	})
	if err != nil {
		return nil, err
	}
	return &v1.CronUpdateOneRes{IsOK: update}, nil
}
