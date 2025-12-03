package gorm

import (
	"time"

	"gorm.io/gorm"
)

type KnowledgeBaseCronSchedule struct {
	ID                int64          `gorm:"primaryKey;column:id"`                                                                       // 主键
	CronName          string         `gorm:"type:varchar(20);column:cron_name"`                                                          // 定时任务名
	KnowledgeBaseName string         `gorm:"type:varchar(255);column:knowledge_base_name;index:idx_kb_cron_knowledge"`                   // 知识库id (关联的是Name字段)
	CronExpression    string         `gorm:"type:varchar(100);column:cron_expression"`                                                   // cron表达式
	Status            int16          `gorm:"type:smallint;column:status"`                                                                // 使用状态 1启用，2暂停，0停止
	ContentType       int16          `gorm:"type:smallint;column:content_type"`                                                          // 更新内容状态 1为全量更新，2为增量更新
	CreatedAt         time.Time      `gorm:"column:created_at"`                                                                          // 创建时间
	UpdatedAt         time.Time      `gorm:"column:updated_at"`                                                                          // 更新时间
	DeletedAt         gorm.DeletedAt `gorm:"column:deleted_at;index"`                                                                    // 删除时间
	KnowledgeBase     KnowledgeBase  `gorm:"foreignKey:KnowledgeBaseName;references:Name;constraint:OnUpdate:RESTRICT,OnDelete:CASCADE"` // 外键关联 (通过Name关联)
}

func (KnowledgeBaseCronSchedule) TableName() string {
	return "knowledge_base_cron_schedule"
}
