package gorm

import "time"

// CronExecute 记录定时任务执行情况
type CronExecute struct {
	ID          int        `gorm:"primaryKey;autoIncrement"`
	CronNameFK  string     `gorm:"type:varchar(20);not null;index:idx_cron_name_execute,unique"` // 唯一索引或普通索引
	ExecuteTime time.Time  `gorm:"type:datetime;not null"`
	NextTime    time.Time  `gorm:"type:datetime;not null"`
	CreatedAt   *time.Time `gorm:"type:timestamp;default:null"`
	UpdatedAt   *time.Time `gorm:"type:timestamp;default:null"`
}

// TableName 指定表名
func (CronExecute) TableName() string {
	return "cron_execute"
}
