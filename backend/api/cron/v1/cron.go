package v1

import "github.com/gogf/gf/v2/frame/g"

type RegularUpdateCreateReq struct {
	g.Meta          `path:"/cronCreate" method:"post"`
	KnowledgeBaseId int64  `json:"knowledge_base_id" v:"required"`
	CronExpression  string `json:"cron_expression" v:"required"`
	Status          int64  `json:"status" v:"required"`
	ContentType     int64  `json:"content_type" v:"required"`
}
type RegularUpdateCreateRes struct {
	g.Meta `mime:"application/json"`
	ID     int64 `json:"id"`
}

type RegularUpdateDeleteReq struct {
	g.Meta `path:"/cronDelete" method:"delete"`
	ID     int64 `json:"id" v:"required"`
}
type RegularUpdateDeleteRes struct {
	g.Meta `mime:"application/json"`
	IsOK   string `json:"is_ok"`
}
