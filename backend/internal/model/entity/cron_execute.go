// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// CronExecute is the golang structure for table cron_execute.
type CronExecute struct {
	Id          int         `json:"id"          orm:"id"           description:""`       //
	CronNameFk  string      `json:"cronNameFk"  orm:"cron_name_fk" description:"定时任务名"`  // 定时任务名
	ExecuteTime *gtime.Time `json:"executeTime" orm:"execute_time" description:"执行时间"`   // 执行时间
	NextTime    *gtime.Time `json:"nextTime"    orm:"next_time"    description:"下次执行时间"` // 下次执行时间
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"   description:""`       //
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"   description:""`       //
}
