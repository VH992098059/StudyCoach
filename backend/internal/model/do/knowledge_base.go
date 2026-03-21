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
	Id          any         //
	UserUuid    any         //
	Name        any         //
	Description any         //
	Category    any         //
	Status      any         //
	CreatedAt   *gtime.Time //
	UpdatedAt   *gtime.Time //
}
