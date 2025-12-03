// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBaseCronSchedule is the golang structure for table knowledge_base_cron_schedule.
type KnowledgeBaseCronSchedule struct {
	Id                int         `json:"id"                orm:"id"                  description:""`                     //
	CronName          string      `json:"cronName"          orm:"cron_name"           description:"定时任务名"`                // 定时任务名
	KnowledgeBaseName string      `json:"knowledgeBaseName" orm:"knowledge_base_name" description:"知识库id"`                // 知识库id
	SchedulingMethod  string      `json:"schedulingMethod"  orm:"scheduling_method"   description:"调度方式"`                 // 调度方式
	CronExpression    string      `json:"cronExpression"    orm:"cron_expression"     description:"cron表达式"`              // cron表达式
	Status            int         `json:"status"            orm:"status"              description:"使用状态 1启用，2暂停，0停止"`     // 使用状态 1启用，2暂停，0停止
	ContentType       int         `json:"contentType"       orm:"content_type"        description:"更新内容状态 1为全量更新，2为增量更新"` // 更新内容状态 1为全量更新，2为增量更新
	CreatedAt         *gtime.Time `json:"createdAt"         orm:"created_at"          description:""`                     //
	UpdatedAt         *gtime.Time `json:"updatedAt"         orm:"updated_at"          description:""`                     //
	DeletedAt         *gtime.Time `json:"deletedAt"         orm:"deleted_at"          description:""`                     //
}
