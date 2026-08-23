package gorm

import "time"

// CronExecute 定时任务执行记录表
type CronExecute struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`               // 主键（UUID）
	CronNameFK  string     `gorm:"type:varchar(20);not null;index:idx_cron_name_execute,unique"` // 定时任务名称（关联 KnowledgeBaseCronSchedule.CronName）
	ExecuteTime time.Time  `gorm:"type:timestamp;not null"`                                      // 本次执行时间
	NextTime    time.Time  `gorm:"type:timestamp;not null"`                                      // 下次计划执行时间
	CreatedAt   *time.Time `gorm:"type:timestamp;default:null"`                                  // 创建时间
	UpdatedAt   *time.Time `gorm:"type:timestamp;default:null"`                                  // 更新时间
}

// TableName 指定表名
func (CronExecute) TableName() string {
	return "cron_execute"
}
