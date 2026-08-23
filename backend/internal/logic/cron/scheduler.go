package cron

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/internal/model/entity"
	"backend/studyCoach/api"
	"context"
	"sync"
	"time"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

var (
	// CronScheduler 全局调度器实例
	CronScheduler *cron.Cron
	// jobMap 存储任务ID与Cron EntryID的映射关系
	jobMap sync.Map
)

// InitScheduler 初始化调度器并加载数据库中的任务
func InitScheduler(ctx context.Context) {
	// 支持秒级控制 (秒 分 时 日 月 周)
	CronScheduler = cron.New(cron.WithSeconds())
	CronScheduler.Start()

	g.Log().Info(ctx, "[Cron] Scheduler started")

	// 加载所有启用状态的任务
	var schedules []*entity.KnowledgeBaseCronSchedule
	err := dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("status", 1).Scan(&schedules)
	if err != nil {
		g.Log().Infof(ctx, "[Cron] Failed to load schedules: %v", err)
		return
	}

	for _, schedule := range schedules {
		if err := AddJob(ctx, schedule); err != nil {
			g.Log().Infof(ctx, "[Cron] Failed to add job %s (ID: %s): %v", schedule.CronName, schedule.Id, err)
		}
	}
}

// AddJob 添加定时任务到调度器
func AddJob(ctx context.Context, schedule *entity.KnowledgeBaseCronSchedule) error {
	// 避免重复添加
	RemoveJob(schedule.Id)

	// 捕获变量
	task := schedule

	entryID, err := CronScheduler.AddFunc(task.CronExpression, func() {
		// 使用新的上下文，避免依赖传入的 ctx（可能已取消）
		runCtx := context.Background()
		g.Log().Infof(ctx, "[Cron] Triggering job %s (ID: %s)", task.CronName, task.Id)

		// 执行任务并记录日志
		executeJobWithLog(runCtx, task, func(ctx context.Context) error {
			// 根据 SchedulingMethod 判断执行类型
			if task.SchedulingMethod == "pomodoro_reminder" {
				// 执行番茄钟提醒
				return api.ExecutePomodoroReminder(ctx, task)
			} else {
				// 执行知识库更新（默认）
				return api.RunRegularUpdateTask(ctx, task)
			}
		})
	})

	if err != nil {
		return err
	}

	jobMap.Store(task.Id, entryID)
	g.Log().Infof(ctx, "[Cron] Job added: %s (ID: %s), EntryID: %d", task.CronName, task.Id, entryID)
	return nil
}

// RemoveJob 从调度器移除任务
func RemoveJob(id string) {
	if val, ok := jobMap.Load(id); ok {
		entryID := val.(cron.EntryID)
		CronScheduler.Remove(entryID)
		jobMap.Delete(id)
		g.Log().Infof(context.Background(), "[Cron] Job removed: ID: %s, EntryID: %d", id, entryID)
	}
}

// executeJobWithLog 包裹任务执行逻辑，记录执行日志和状态
func executeJobWithLog(ctx context.Context, schedule *entity.KnowledgeBaseCronSchedule, taskFunc func(ctx context.Context) error) {
	startTime := time.Now()
	var executeId string
	var err error

	// 1. 创建执行记录，状态为执行中（UUID 主键：Go 侧预生成 ID）
	executeId = uuid.NewString()
	_, err = dao.CronExecute.Ctx(ctx).Data(do.CronExecute{
		Id:          executeId,
		CronId:      schedule.Id,
		CronNameFk:  schedule.CronName,
		ExecuteTime: gtime.Now(),
		Status:      0, // 执行中
	}).Insert()
	if err != nil {
		g.Log().Infof(ctx, "[Cron] Failed to create execute record for job %s (ID: %s): %v", schedule.CronName, schedule.Id, err)
		// 即使创建记录失败，也要执行任务
		err = taskFunc(ctx)
		if err != nil {
			g.Log().Infof(ctx, "[Cron] Job %s (ID: %s) failed: %v", schedule.CronName, schedule.Id, err)
		}
		return
	}

	g.Log().Infof(ctx, "[Cron] Job started: %s (ID: %s), ExecuteID: %s", schedule.CronName, schedule.Id, executeId)

	// 2. 执行任务
	err = taskFunc(ctx)
	duration := time.Since(startTime).Milliseconds()

	// 3. 更新执行状态
	if err != nil {
		// 执行失败
		_, updateErr := dao.CronExecute.Ctx(ctx).Where("id", executeId).Data(do.CronExecute{
			Status:       2, // 失败
			ErrorMessage: err.Error(),
			Duration:     duration,
		}).Update()
		if updateErr != nil {
			g.Log().Infof(ctx, "[Cron] Failed to update execute status for job %s (ID: %s): %v", schedule.CronName, schedule.Id, updateErr)
		}
		g.Log().Infof(ctx, "[Cron] Job failed: %s (ID: %s), ExecuteID: %s, Duration: %dms, Error: %v", schedule.CronName, schedule.Id, executeId, duration, err)

		// 记录错误日志
		_, logErr := dao.CronLog.Ctx(ctx).Data(do.CronLog{
			ExecuteId:  executeId,
			CronId:     schedule.Id,
			CronNameFk: schedule.CronName,
			Content:    err.Error(),
			Level:      "error",
		}).OmitEmpty().Insert()
		if logErr != nil {
			g.Log().Infof(ctx, "[Cron] Failed to write error log for job %s (ID: %s): %v", schedule.CronName, schedule.Id, logErr)
		}
	} else {
		// 执行成功
		_, updateErr := dao.CronExecute.Ctx(ctx).Where("id", executeId).Data(do.CronExecute{
			Status:   1, // 成功
			Duration: duration,
		}).Update()
		if updateErr != nil {
			g.Log().Infof(ctx, "[Cron] Failed to update execute status for job %s (ID: %s): %v", schedule.CronName, schedule.Id, updateErr)
		}
		g.Log().Infof(ctx, "[Cron] Job succeeded: %s (ID: %s), ExecuteID: %s, Duration: %dms", schedule.CronName, schedule.Id, executeId, duration)

		// 记录成功日志
		_, logErr := dao.CronLog.Ctx(ctx).Data(do.CronLog{
			ExecuteId:  executeId,
			CronId:     schedule.Id,
			CronNameFk: schedule.CronName,
			Content:    "任务执行成功",
			Level:      "info",
		}).OmitEmpty().Insert()
		if logErr != nil {
			g.Log().Infof(ctx, "[Cron] Failed to write info log for job %s (ID: %s): %v", schedule.CronName, schedule.Id, logErr)
		}
	}
}
