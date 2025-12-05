package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

type CronExecuteCreateReq struct {
	g.Meta      `path:"/v1/cronExecuteCreate" method:"post"`
	CronNameFk  string      `json:"cron_name_fk" v:"required"`
	ExecuteTime *gtime.Time `json:"execute_time" v:"required"`
}
type CronExecuteCreateRes struct {
	Id int64 `json:"id"`
}
