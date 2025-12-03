package cron

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/internal/model/entity"
	"context"
)

const (
	defaultPageSize = 10
	maxPageSize     = 100
)

func RuCronCreate(ctx context.Context, schedule *entity.KnowledgeBaseCronSchedule) (id int64, err error) {
	id, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Data(do.KnowledgeBaseCronSchedule{
		KnowledgeBaseName: schedule.KnowledgeBaseName,
		CronExpression:    schedule.CronExpression,
		CronName:          schedule.CronName,
		Status:            schedule.Status,
		ContentType:       schedule.ContentType,
		SchedulingMethod:  schedule.SchedulingMethod,
	}).InsertAndGetId()
	if err != nil {
		return -1, err
	}
	return id, nil
}

func RuCronDelete(ctx context.Context, id int64) (isOk string, err error) {
	_, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", id).Unscoped().Delete()
	if err != nil {
		return "", err
	}
	return "success", err
}

func RuCronList(ctx context.Context, page, pageSize int) (list []entity.KnowledgeBaseCronSchedule, err error) {
	// 参数验证和默认值设置
	if page < 1 {
		page = 0
	}
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Fields("id,cron_name,scheduling_method,cron_expression,knowledge_base_name, status, content_type").Scan(&list)
	if err != nil {
		return nil, err
	}
	return
}

func RuCronUpdate(ctx context.Context, schedule *entity.KnowledgeBaseCronSchedule) (success string, err error) {
	_, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", schedule.Id).Data(do.KnowledgeBaseCronSchedule{
		CronName:          schedule.CronName,
		KnowledgeBaseName: schedule.KnowledgeBaseName,
		CronExpression:    schedule.CronExpression,
		Status:            schedule.Status,
		ContentType:       schedule.ContentType,
		SchedulingMethod:  schedule.SchedulingMethod,
	}).Update()
	if err != nil {
		return "", err
	}
	return "success", nil
}

func RuCronUpdateStatus(ctx context.Context, id int64, status int64) (success string, err error) {
	_, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", id).Data(do.KnowledgeBaseCronSchedule{Status: status}).Update()
	if err != nil {
		return "", err
	}
	return "success", nil
}
