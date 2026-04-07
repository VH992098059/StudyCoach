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
	g.Meta       `orm:"table:cron_execute, do:true"`
	Id           any         // 执行记录ID
	CronId       any         // 关联定时任务ID
	CronNameFk   any         // 定时任务名称（冗余字段）
	ExecuteTime  *gtime.Time // 执行开始时间
	NextTime     *gtime.Time // 下次执行时间
	Status       any         // 执行状态：0=执行中，1=成功，2=失败
	ErrorMessage any         // 失败时的错误信息
	Duration     any         // 执行耗时（毫秒）
	CreatedAt    *gtime.Time // 创建时间
	UpdatedAt    *gtime.Time // 更新时间
}
