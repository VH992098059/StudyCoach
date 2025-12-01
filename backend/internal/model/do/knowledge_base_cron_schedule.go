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
	CronName        any         // 定时任务名
	KnowledgeBaseId any         // 知识库id
	CronExpression  any         // cron表达式
	Status          any         // 使用状态 1启用，2暂停，0停止
	ContentType     any         // 更新内容状态 1为全量更新，2为增量更新
	CreatedAt       *gtime.Time //
	UpdatedAt       *gtime.Time //
	DeletedAt       *gtime.Time //
}
