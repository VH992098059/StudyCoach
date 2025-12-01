package v1

import (
	"backend/internal/model/entity"

	"github.com/gogf/gf/v2/frame/g"
)

type CronCreateReq struct {
	g.Meta          `path:"/cronCreate" method:"post"`
	CronName        string `json:"cron_name" v:"required"`
	KnowledgeBaseId int64  `json:"knowledge_base_id" v:"required"`
	CronExpression  string `json:"cron_expression" v:"required"`
	Status          int64  `json:"status" v:"required"`
	ContentType     int64  `json:"content_type" v:"required"`
}
type CronCreateRes struct {
	ID int64 `json:"id"`
}

type CronDeleteReq struct {
	g.Meta `path:"/cronDelete" method:"delete"`
	ID     int64 `json:"id" v:"required"`
}
type CronDeleteRes struct {
	IsOK string `json:"is_ok"`
}

type CronListReq struct {
	g.Meta `path:"/cronList" method:"get"`
	Page   int `p:"page" dc:"page" v:"required|min:1" d:"1"`
	Size   int `p:"size" dc:"size" v:"required|min:1|max:100" d:"10"`
}
type CronListRes struct {
	List []*entity.KnowledgeBaseCronSchedule `json:"list"`
}

type CronGetOneReq struct {
	g.Meta `path:"/cronGetOne" method:"get"`
	Id     int64 `json:"id"`
}
type CronGetOneRes struct {
	One *entity.KnowledgeBaseCronSchedule `json:"one"`
}

type CronUpdateOneReq struct {
	g.Meta `path:"/cronUpdateOne" method:"put"`
	Id     int64 `json:"id"`
}
type CronUpdateOneRes struct {
	IsOK string `json:"is_ok"`
}
