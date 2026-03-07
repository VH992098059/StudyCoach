package gorm

import "time"

// CronLog 定时任务执行日志表
type CronLog struct {
	ID            int64         `gorm:"primaryKey;column:id"`                                                          // 主键
	CronID        int64         `gorm:"column:cron_id;index:index_id_time,priority:1"`                                 // 关联的知识库 ID（外键 → KnowledgeBase.ID，联合索引）
	Content       string        `gorm:"type:text;column:content"`                                                      // 日志内容
	Level         string        `gorm:"type:varchar(10);column:level"`                                                 // 日志级别：INFO、ERROR 等
	CreateTime    time.Time     `gorm:"column:create_time;index:index_id_time,priority:2"`                             // 日志创建时间（联合索引）
	KnowledgeBase KnowledgeBase `gorm:"foreignKey:CronID;references:ID;constraint:OnUpdate:RESTRICT,OnDelete:CASCADE"` // 关联知识库（通过 CronID 映射）
}

// TableName 强制指定表名为 cron_log
func (CronLog) TableName() string {
	return "cron_log"
}
