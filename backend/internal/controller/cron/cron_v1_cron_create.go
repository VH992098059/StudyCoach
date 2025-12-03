package cron

import (
	"backend/internal/logic/cron"
	"backend/internal/model/entity"
	"context"

	"backend/api/cron/v1"
)

func (c *ControllerV1) CronCreate(ctx context.Context, req *v1.CronCreateReq) (res *v1.CronCreateRes, err error) {
	create, err := cron.RuCronCreate(ctx, &entity.KnowledgeBaseCronSchedule{
		CronName:          req.CronName,
		CronExpression:    req.CronExpression,
		ContentType:       int(req.ContentType),
		SchedulingMethod:  req.SchedulingMethod,
		Status:            int(req.Status),
		KnowledgeBaseName: req.KnowledgeBaseName,
	})
	if err != nil {
		return nil, err
	}
	return &v1.CronCreateRes{ID: create}, nil
}
