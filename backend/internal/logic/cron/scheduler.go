package cron

import (
	"backend/internal/dao"
	"backend/internal/model/entity"
	"backend/studyCoach/api"
	"context"
	"log"
	"sync"

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

	log.Println("[Cron] Scheduler started")

	// 加载所有启用状态的任务
	var schedules []*entity.KnowledgeBaseCronSchedule
	err := dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("status", 1).Scan(&schedules)
	if err != nil {
		log.Printf("[Cron] Failed to load schedules: %v", err)
		return
	}

	for _, schedule := range schedules {
		if err := AddJob(ctx, schedule); err != nil {
			log.Printf("[Cron] Failed to add job %s (ID: %d): %v", schedule.CronName, schedule.Id, err)
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
		log.Printf("[Cron] Triggering job %s (ID: %d)", task.CronName, task.Id)
		if err := api.RunRegularUpdateTask(runCtx, task); err != nil {
			log.Printf("[Cron] Job %s (ID: %d) failed: %v", task.CronName, task.Id, err)
		}
	})

	if err != nil {
		return err
	}

	jobMap.Store(task.Id, entryID)
	log.Printf("[Cron] Job added: %s (ID: %d), EntryID: %d", task.CronName, task.Id, entryID)
	return nil
}

// RemoveJob 从调度器移除任务
func RemoveJob(id int) {
	if val, ok := jobMap.Load(id); ok {
		entryID := val.(cron.EntryID)
		CronScheduler.Remove(entryID)
		jobMap.Delete(id)
		log.Printf("[Cron] Job removed: ID: %d, EntryID: %d", id, entryID)
	}
}
