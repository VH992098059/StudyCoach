// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// CronExecute is the golang structure for table cron_execute.
type CronExecute struct {
	Id          int64       `json:"id"          orm:"id"           description:""` //
	CronNameFk  string      `json:"cronNameFk"  orm:"cron_name_fk" description:""` //
	ExecuteTime *gtime.Time `json:"executeTime" orm:"execute_time" description:""` //
	NextTime    *gtime.Time `json:"nextTime"    orm:"next_time"    description:""` //
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"   description:""` //
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"   description:""` //
}
