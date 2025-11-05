package v1

import "github.com/gogf/gf/v2/frame/g"

type CronReq struct {
	g.Meta          `path:"cron" method:"post"`
	KnowledgeBaseId int64  `json:"knowledge_base_id"`
	CronTime        string `json:"cron_time"`
}
type CronRes struct {
	g.Meta `mime:"application/json"`
}
