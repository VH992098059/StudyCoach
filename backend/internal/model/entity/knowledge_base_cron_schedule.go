// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBaseCronSchedule is the golang structure for table knowledge_base_cron_schedule.
type KnowledgeBaseCronSchedule struct {
	Id                int64       `json:"id"                orm:"id"                  description:""` //
	CronName          string      `json:"cronName"          orm:"cron_name"           description:""` //
	KnowledgeBaseName string      `json:"knowledgeBaseName" orm:"knowledge_base_name" description:""` //
	CronExpression    string      `json:"cronExpression"    orm:"cron_expression"     description:""` //
	SchedulingMethod  string      `json:"schedulingMethod"  orm:"scheduling_method"   description:""` //
	Status            int         `json:"status"            orm:"status"              description:""` //
	ContentType       int         `json:"contentType"       orm:"content_type"        description:""` //
	CreatedAt         *gtime.Time `json:"createdAt"         orm:"created_at"          description:""` //
	UpdatedAt         *gtime.Time `json:"updatedAt"         orm:"updated_at"          description:""` //
	DeletedAt         *gtime.Time `json:"deletedAt"         orm:"deleted_at"          description:""` //
}
