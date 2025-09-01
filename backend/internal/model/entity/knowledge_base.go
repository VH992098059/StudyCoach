// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBase is the golang structure for table knowledge_base.
type KnowledgeBase struct {
	Id          int64       `json:"id"          orm:"id"          description:"知识库ID，主键"`     // 知识库ID，主键
	Name        string      `json:"name"        orm:"name"        description:"知识库名称"`        // 知识库名称
	Description string      `json:"description" orm:"description" description:"知识库描述"`        // 知识库描述
	Category    string      `json:"category"    orm:"category"    description:"知识库分类"`        // 知识库分类
	Status      int         `json:"status"      orm:"status"      description:"状态：1-启用，2-禁用"` // 状态：1-启用，2-禁用
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"  description:"创建时间"`         // 创建时间
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"  description:"更新时间"`         // 更新时间
}
