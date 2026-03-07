// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// CronExecute is the golang structure of table cron_execute for DAO operations like Where/Data.
type CronExecute struct {
	g.Meta      `orm:"table:cron_execute, do:true"`
	Id          any         //
	CronNameFk  any         //
	ExecuteTime *gtime.Time //
	NextTime    *gtime.Time //
	CreatedAt   *gtime.Time //
	UpdatedAt   *gtime.Time //
}
