// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// CronLog is the golang structure of table cron_log for DAO operations like Where/Data.
type CronLog struct {
	g.Meta     `orm:"table:cron_log, do:true"`
	Id         any         // 日志ID
	ExecuteId  any         // 关联执行记录ID
	CronId     any         // 关联定时任务ID
	CronNameFk any         // 定时任务名称（冗余字段）
	Content    any         // 日志内容
	Level      any         // 日志级别：info/error/warn
	CreateTime *gtime.Time // 创建时间
}
