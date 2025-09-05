// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBaseCronSchedule is the golang structure for table knowledge_base_cron_schedule.
type KnowledgeBaseCronSchedule struct {
	Id              int64       `json:"id"              orm:"id"                description:""` //
	KnowledgeBaseId int64       `json:"knowledgeBaseId" orm:"knowledge_base_id" description:""` //
	CronExpression  string      `json:"cronExpression"  orm:"cron_expression"   description:""` //
	CreatedAt       *gtime.Time `json:"createdAt"       orm:"created_at"        description:""` //
	UpdatedAt       *gtime.Time `json:"updatedAt"       orm:"updated_at"        description:""` //
}
