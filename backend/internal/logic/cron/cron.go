package cron

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/internal/model/entity"
	api "backend/studyCoach/api"
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

	// 如果状态为启用，添加到调度器
	if schedule.Status == 1 {
		schedule.Id = id
		if err := AddJob(ctx, schedule); err != nil {
			// 仅记录日志，不影响创建成功
			// log.Printf("[Cron] Failed to schedule job after create: %v", err)
		}
	}

	return id, nil
}

func RuCronDelete(ctx context.Context, id int64) (isOk string, err error) {
	// 先移除调度任务
	RemoveJob(id)

	_, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", id).Unscoped().Delete()
	if err != nil {
		return "", err
	}
	return "success", err
}

// RuCronList 仅返回当前用户名下知识库所绑定的定时任务（通过 knowledge_base.user_uuid 与 knowledge_base_name 关联）。
func RuCronList(ctx context.Context, userUUID string, page, pageSize int) (list []entity.KnowledgeBaseCronSchedule, err error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	if pageSize > maxPageSize {
		pageSize = maxPageSize
	}
	var kbs []entity.KnowledgeBase
	err = dao.KnowledgeBase.Ctx(ctx).
		Where(dao.KnowledgeBase.Columns().UserUuid, userUUID).
		Fields(dao.KnowledgeBase.Columns().Name).
		Scan(&kbs)
	if err != nil {
		return nil, err
	}
	if len(kbs) == 0 {
		return []entity.KnowledgeBaseCronSchedule{}, nil
	}
	names := make([]interface{}, len(kbs))
	for i := range kbs {
		names[i] = kbs[i].Name
	}
	err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).
		WhereIn(dao.KnowledgeBaseCronSchedule.Columns().KnowledgeBaseName, names).
		OrderDesc(dao.KnowledgeBaseCronSchedule.Columns().Id).
		Page(page, pageSize).
		Scan(&list)
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

	// 更新调度器
	if schedule.Status == 1 {
		// 重新查询完整信息以确保字段完整
		var fullSchedule entity.KnowledgeBaseCronSchedule
		if err := dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", schedule.Id).Scan(&fullSchedule); err == nil {
			AddJob(ctx, &fullSchedule)
		}
	} else {
		RemoveJob(schedule.Id)
	}

	return "success", nil
}

func RuCronUpdateStatus(ctx context.Context, id int64, status int64) (success string, err error) {
	_, err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", id).Data(do.KnowledgeBaseCronSchedule{Status: status}).Update()
	if err != nil {
		return "", err
	}

	// 更新调度器
	if status == 1 {
		// 查询完整信息以添加到调度器
		var schedule entity.KnowledgeBaseCronSchedule
		if err := dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", id).Scan(&schedule); err == nil {
			AddJob(ctx, &schedule)
		}
	} else {
		RemoveJob(id)
	}

	return "success", nil
}

// RuCronRun 立即执行一次任务
func RuCronRun(ctx context.Context, id int64) (success string, err error) {
	// 查询任务详情
	var schedule entity.KnowledgeBaseCronSchedule
	err = dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", id).Scan(&schedule)
	if err != nil {
		return "", err
	}

	// 异步执行任务，避免阻塞 HTTP 请求
	go func() {
		// 创建一个新的上下文，避免因 HTTP 请求结束而取消
		runCtx := context.Background()
		if err := api.RunRegularUpdateTask(runCtx, &schedule); err != nil {
			// 这里可以记录错误日志
			// log.Printf("Manual run failed for task %d: %v", id, err)
		}
	}()

	return "success", nil
}
