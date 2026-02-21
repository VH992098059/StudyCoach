package v1

import (
	"backend/internal/model/entity"

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

type CronExecuteListReq struct {
	g.Meta     `path:"/v1/cronExecuteList" method:"get"`
	CronNameFk string `json:"cron_name_fk" v:"required"`
	Page       int    `json:"page" d:"1" v:"min:1"`
	Size       int    `json:"size" d:"10" v:"max:100"`
}

type CronExecuteListRes struct {
	List  []entity.CronExecute `json:"list"`
	Total int                  `json:"total"`
}
