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
	CronNameFk  any         // 定时任务名
	ExecuteTime *gtime.Time // 执行时间
	NextTime    *gtime.Time // 下次执行时间
	CreatedAt   *gtime.Time //
	UpdatedAt   *gtime.Time //
}
