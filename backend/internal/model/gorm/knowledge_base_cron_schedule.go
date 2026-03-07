package gorm

import (
	"time"

	"gorm.io/gorm"
)

// KnowledgeBaseCronSchedule 知识库定时任务调度表
type KnowledgeBaseCronSchedule struct {
	ID                int64          `gorm:"primaryKey;column:id"`                                                                       // 主键
	CronName          string         `gorm:"type:varchar(20);column:cron_name"`                                                          // 定时任务名称，用于标识该调度
	KnowledgeBaseName string         `gorm:"type:varchar(255);column:knowledge_base_name;index:idx_kb_cron_knowledge"`                   // 关联的知识库名称（对应 KnowledgeBase.Name）
	CronExpression    string         `gorm:"type:varchar(100);column:cron_expression"`                                                   // Cron 表达式，定义执行周期（如 "0 0 * * *" 表示每天零点）
	SchedulingMethod  string         `gorm:"type:varchar(50);column:scheduling_method"`                                                  // 调度方式（如定时、间隔等）
	Status            int16          `gorm:"type:smallint;column:status"`                                                                // 调度状态：0 停止，1 启用，2 暂停
	ContentType       int16          `gorm:"type:smallint;column:content_type"`                                                          // 更新模式：1 全量更新，2 增量更新
	CreatedAt         time.Time      `gorm:"column:created_at"`                                                                          // 创建时间
	UpdatedAt         time.Time      `gorm:"column:updated_at"`                                                                          // 更新时间
	DeletedAt         gorm.DeletedAt `gorm:"column:deleted_at;index"`                                                                    // 软删除时间
	KnowledgeBase     KnowledgeBase  `gorm:"foreignKey:KnowledgeBaseName;references:Name;constraint:OnUpdate:RESTRICT,OnDelete:CASCADE"` // 关联的知识库
}

func (KnowledgeBaseCronSchedule) TableName() string {
	return "knowledge_base_cron_schedule"
}
