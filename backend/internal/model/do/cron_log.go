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
	Id         any         //
	CronNameFk any         // 定时任务名外键
	Content    any         // 日志内容
	Level      any         // 日志级别 (INFO, ERROR)
	CreateTime *gtime.Time // 创建时间
}
