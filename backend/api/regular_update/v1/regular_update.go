package v1

import "github.com/gogf/gf/v2/frame/g"

type RegularUpdateCreateReq struct {
	g.Meta          `path:"/rucreate" method:"post" tags:"regular_update" sm:"创建定时更新任务"`
	KnowledgeBaseId int64  `json:"knowledge_base_id" v:"required"`
	CronExpression  string `json:"cron_expression" v:"required"`
}
type RegularUpdateCreateRes struct {
	g.Meta `mime:"application/json"`
	ID     int64 `json:"id"`
}

type RegularUpdateDeleteReq struct {
	g.Meta `path:"/rudelete" method:"delete" tags:"regular_update" sm:"删除定时更新任务"`
	ID     int64 `json:"id" v:"required"`
}
type RegularUpdateDeleteRes struct {
	g.Meta `mime:"application/json"`
	IsOK   string `json:"is_ok"`
}
