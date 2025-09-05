package regular_update

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"context"
)

func RuCreate(ctx context.Context, knowledgeBaseId int64, CronExpression string) (id int64, err error) {
	id, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Data(do.KnowledgeBaseCronSchedule{
		KnowledgeBaseId: knowledgeBaseId,
		CronExpression:  CronExpression,
	}).InsertAndGetId()
	if err != nil {
		return -1, err
	}
	return id, nil
}

func RuDelete(ctx context.Context, id int64) (isOk string, err error) {
	_, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Data(do.KnowledgeBaseCronSchedule{
		Id: id,
	}).Delete()
	if err != nil {
		return "", err
	}
	return "success", err
}
