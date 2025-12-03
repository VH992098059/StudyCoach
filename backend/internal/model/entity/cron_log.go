// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// CronLog is the golang structure for table cron_log.
type CronLog struct {
	Id         int         `json:"id"         orm:"id"           description:""`                   //
	CronNameFk string      `json:"cronNameFk" orm:"cron_name_fk" description:"定时任务名外键"`            // 定时任务名外键
	Content    string      `json:"content"    orm:"content"      description:"日志内容"`               // 日志内容
	Level      string      `json:"level"      orm:"level"        description:"日志级别 (INFO, ERROR)"` // 日志级别 (INFO, ERROR)
	CreateTime *gtime.Time `json:"createTime" orm:"create_time"  description:"创建时间"`               // 创建时间
}
