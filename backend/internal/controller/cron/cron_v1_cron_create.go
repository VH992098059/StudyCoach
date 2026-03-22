package cron

import (
	"backend/api/cron/v1"
	"backend/internal/logic/cron"
	"backend/internal/logic/knowledge"
	"backend/internal/model/entity"
	"backend/utility"
	"context"
)

func (c *ControllerV1) CronCreate(ctx context.Context, req *v1.CronCreateReq) (res *v1.CronCreateRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err := knowledge.EnsureKnowledgeBaseBelongsToUser(ctx, userUUID, req.KnowledgeBaseName); err != nil {
		return nil, err
	}
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
