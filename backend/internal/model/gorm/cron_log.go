package gorm

import "time"

type CronLog struct {
	ID            int64         `gorm:"primaryKey;column:id"`                                                          // 主键
	CronID        int64         `gorm:"column:cron_id;uniqueIndex:index_id_time,priority:1"`                           // 定时任务ID外键，联合唯一索引
	Content       string        `gorm:"type:text;column:content"`                                                      // 日志内容
	Level         string        `gorm:"type:varchar(10);column:level"`                                                 // 日志级别 (INFO, ERROR)
	CreateTime    time.Time     `gorm:"column:create_time;uniqueIndex:index_id_time,priority:2"`                       // 创建时间，联合唯一索引
	KnowledgeBase KnowledgeBase `gorm:"foreignKey:CronID;references:ID;constraint:OnUpdate:RESTRICT,OnDelete:CASCADE"` // 外键关联
}

// TableName 强制指定表名为 cron_log
func (CronLog) TableName() string {
	return "cron_log"
}
