// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBase is the golang structure of table knowledge_base for DAO operations like Where/Data.
type KnowledgeBase struct {
	g.Meta      `orm:"table:knowledge_base, do:true"`
	Id          interface{} // 知识库ID，主键
	Name        interface{} // 知识库名称
	Description interface{} // 知识库描述
	Category    interface{} // 知识库分类
	Status      interface{} // 状态：1-启用，2-禁用
	CreatedAt   *gtime.Time // 创建时间
	UpdatedAt   *gtime.Time // 更新时间
}
