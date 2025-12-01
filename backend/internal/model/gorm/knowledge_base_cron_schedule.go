package gorm

import (
	"time"

	"gorm.io/gorm"
)

type KnowledgeBaseCronSchedule struct {
	ID              int64          `gorm:"primaryKey;column:id"`                                                                   // 主键
	CronName        string         `gorm:"type:char(20);column:cron_name"`                                                         // 定时任务名
	KnowledgeBaseID int64          `gorm:"column:knowledge_base_id;uniqueIndex:idx_knowledge"`                                     // 知识库ID，唯一索引
	CronExpression  string         `gorm:"type:varchar(100);column:cron_expression"`                                               // cron表达式
	Status          int16          `gorm:"column:status"`                                                                          // 任务状态（启用，停用，删除）
	ContentType     int16          `gorm:"column:content_type"`                                                                    // 触发内容类型（全部更新，文档更新）
	CreatedAt       time.Time      `gorm:"column:created_at"`                                                                      // 创建时间
	UpdatedAt       time.Time      `gorm:"column:updated_at"`                                                                      // 更新时间
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index"`                                                                // 删除时间（软删除）
	KnowledgeBase   KnowledgeBase  `gorm:"foreignKey:KnowledgeBaseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"` // 外键关联
}

func (KnowledgeBaseCronSchedule) TableName() string {
	return "knowledge_base_cron_schedule"
}
