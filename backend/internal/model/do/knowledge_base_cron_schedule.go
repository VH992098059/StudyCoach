// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBaseCronSchedule is the golang structure of table knowledge_base_cron_schedule for DAO operations like Where/Data.
type KnowledgeBaseCronSchedule struct {
	g.Meta          `orm:"table:knowledge_base_cron_schedule, do:true"`
	Id              any         //
	KnowledgeBaseId any         //
	CronExpression  any         //
	CreatedAt       *gtime.Time //
	UpdatedAt       *gtime.Time //
}
