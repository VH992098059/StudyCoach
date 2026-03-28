package ai_chat

import (
	"backend/api/ai_chat/v1"
	"backend/internal/logic/cron"
	"backend/internal/model/entity"
	"context"
	"fmt"
	"log"
	"time"
)

// PauseTaskPomodoro 暂停任务番茄钟 - 改为 5 分钟后提醒
func (c *ControllerV1) PauseTaskPomodoro(ctx context.Context, req *v1.PauseTaskPomodoroReq) (res *v1.PauseTaskPomodoroRes, err error) {
	cronID := req.CronId
	if cronID <= 0 {
		return nil, fmt.Errorf("cronId 无效")
	}

	// 计算 5 分钟后的时间
	fireTime := time.Now().Add(5 * time.Minute)
	newCronExpr := fmt.Sprintf("%d %d %d %d *", fireTime.Minute(), fireTime.Hour(), fireTime.Day(), fireTime.Month())

	// 更新定时任务
	if _, err := cron.RuCronUpdate(ctx, &entity.KnowledgeBaseCronSchedule{
		Id:             cronID,
		CronExpression: newCronExpr,
		Status:         1,
	}); err != nil {
		log.Printf("[task] 暂停番茄钟失败 cronId=%d: %v", cronID, err)
		return nil, err
	}

	log.Printf("[task] 已暂停番茄钟 cronId=%d，5 分钟后提醒", cronID)
	return &v1.PauseTaskPomodoroRes{Success: true}, nil
}

// StopTaskPomodoro 停止任务番茄钟 - 删除定时任务
func (c *ControllerV1) StopTaskPomodoro(ctx context.Context, req *v1.StopTaskPomodoroReq) (res *v1.StopTaskPomodoroRes, err error) {
	cronID := req.CronId
	if cronID <= 0 {
		return nil, fmt.Errorf("cronId 无效")
	}

	// 删除定时任务
	if _, err := cron.RuCronDelete(ctx, cronID); err != nil {
		log.Printf("[task] 停止番茄钟失败 cronId=%d: %v", cronID, err)
		return nil, err
	}

	log.Printf("[task] 已停止番茄钟 cronId=%d", cronID)
	return &v1.StopTaskPomodoroRes{Success: true}, nil
}
