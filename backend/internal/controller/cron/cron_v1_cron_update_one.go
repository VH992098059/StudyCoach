package cron

import (
	"backend/api/cron/v1"
	"backend/internal/logic/cron"
	"backend/internal/logic/knowledge"
	"backend/internal/model/entity"
	"backend/utility"
	"context"
)

func (c *ControllerV1) CronUpdateOne(ctx context.Context, req *v1.CronUpdateOneReq) (res *v1.CronUpdateOneRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err := knowledge.EnsureCronScheduleBelongsToUser(ctx, userUUID, req.Id); err != nil {
		return nil, err
	}
	if err := knowledge.EnsureKnowledgeBaseBelongsToUser(ctx, userUUID, req.KnowledgeBaseName); err != nil {
		return nil, err
	}
	update, err := cron.RuCronUpdate(ctx, &entity.KnowledgeBaseCronSchedule{
		Id:                req.Id,
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
