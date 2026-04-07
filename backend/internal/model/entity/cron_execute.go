// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// CronExecute is the golang structure for table cron_execute.
type CronExecute struct {
	Id           int64       `json:"id"           orm:"id"            description:"执行记录ID"`               //
	CronId       int64       `json:"cronId"       orm:"cron_id"       description:"关联定时任务ID"`             //
	CronNameFk   string      `json:"cronNameFk"   orm:"cron_name_fk"  description:"定时任务名称（冗余字段）"`         //
	ExecuteTime  *gtime.Time `json:"executeTime"  orm:"execute_time"  description:"执行开始时间"`               //
	NextTime     *gtime.Time `json:"nextTime"     orm:"next_time"     description:"下次执行时间"`               //
	Status       int         `json:"status"       orm:"status"        description:"执行状态：0=执行中，1=成功，2=失败"` //
	ErrorMessage string      `json:"errorMessage" orm:"error_message" description:"失败时的错误信息"`             //
	Duration     int64       `json:"duration"     orm:"duration"      description:"执行耗时（毫秒）"`             //
	CreatedAt    *gtime.Time `json:"createdAt"    orm:"created_at"    description:"创建时间"`                 //
	UpdatedAt    *gtime.Time `json:"updatedAt"    orm:"updated_at"    description:"更新时间"`                 //
}
