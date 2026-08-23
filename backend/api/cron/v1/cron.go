package v1

import (
	"backend/internal/model/entity"

	"github.com/gogf/gf/v2/frame/g"
)

type CronCreateReq struct {
	g.Meta            `path:"/v1/cronCreate" method:"post"`
	CronName          string `json:"cron_name" v:"required"`
	KnowledgeBaseName string `json:"knowledge_base_name" v:"required"`
	CronExpression    string `json:"cron_expression" v:"required"`
	SchedulingMethod  string `json:"scheduling_method" v:"required"`
	Status            int64  `json:"status" v:"required"`
	ContentType       int64  `json:"content_type" v:"required"`
}
type CronCreateRes struct {
	ID string `json:"id"` // UUID
}

type CronDeleteReq struct {
	g.Meta `path:"/v1/cronDelete" method:"delete"`
	ID     string `json:"id" v:"required"` // UUID
}
type CronDeleteRes struct {
	IsOK string `json:"is_ok"`
}

type CronListReq struct {
	g.Meta `path:"/v1/cronList" method:"get"`
	Page   int `p:"page" dc:"page" v:"required|min:1" d:"1"`
	Size   int `p:"size" dc:"size" v:"required|min:1|max:100" d:"10"`
}
type CronListRes struct {
	List []entity.KnowledgeBaseCronSchedule `json:"list"`
}

type CronGetOneReq struct {
	g.Meta `path:"/v1/cronGetOne" method:"get"`
	Id     string `json:"id"` // UUID
}
type CronGetOneRes struct {
	One *entity.KnowledgeBaseCronSchedule `json:"one"`
}

type CronUpdateOneReq struct {
	g.Meta            `path:"/v1/cronUpdateOne" method:"put"`
	Id                string `json:"id"` // UUID
	CronName          string `json:"cron_name" v:"required"`
	KnowledgeBaseName string `json:"knowledge_base_name" v:"required"`
	CronExpression    string `json:"cron_expression" v:"required"`
	Status            int64  `json:"status" v:"required"`
	ContentType       int64  `json:"content_type" v:"required"`
	SchedulingMethod  string `json:"scheduling_method" v:"required"`
}
type CronUpdateOneRes struct {
	IsOK string `json:"is_ok"`
}

type CronUpdateStatusReq struct {
	g.Meta `path:"/v1/cronUpdateOneStatus" method:"put"`
	Id     string `json:"id"` // UUID
	Status int64  `json:"status" v:"required"`
}
type CronUpdateStatusRes struct {
	IsOK string `json:"is_ok"`
}

type CronRunReq struct {
	g.Meta `path:"/v1/cronRun" method:"post"`
	Id     string `json:"id" v:"required"` // UUID
}

type CronRunRes struct {
	IsOK string `json:"is_ok"`
}
