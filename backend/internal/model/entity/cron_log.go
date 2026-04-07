// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// CronLog is the golang structure for table cron_log.
type CronLog struct {
	Id         int64       `json:"id"         orm:"id"          description:"日志ID"`                 //
	ExecuteId  int64       `json:"executeId"  orm:"execute_id"  description:"关联执行记录ID"`             //
	CronId     int64       `json:"cronId"     orm:"cron_id"     description:"关联定时任务ID"`             //
	CronNameFk string      `json:"cronNameFk" orm:"cron_name_fk" description:"定时任务名称（冗余字段）"`        //
	Content    string      `json:"content"    orm:"content"     description:"日志内容"`                 //
	Level      string      `json:"level"      orm:"level"       description:"日志级别：info/error/warn"` //
	CreateTime *gtime.Time `json:"createTime" orm:"create_time" description:"创建时间"`                 //
}
