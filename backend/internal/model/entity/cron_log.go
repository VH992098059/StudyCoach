// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// CronLog is the golang structure for table cron_log.
type CronLog struct {
	Id         int64       `json:"id"         orm:"id"          description:""` //
	CronId     int64       `json:"cronId"     orm:"cron_id"     description:""` //
	Content    string      `json:"content"    orm:"content"     description:""` //
	Level      string      `json:"level"      orm:"level"       description:""` //
	CreateTime *gtime.Time `json:"createTime" orm:"create_time" description:""` //
}
