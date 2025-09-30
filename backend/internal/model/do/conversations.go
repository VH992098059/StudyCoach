// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
)

// Conversations is the golang structure of table conversations for DAO operations like Where/Data.
type Conversations struct {
	g.Meta     `orm:"table:conversations, do:true"`
	Id         interface{} //
	ConvId     interface{} //
	Title      interface{} //
	CreatedAt  interface{} //
	UpdatedAt  interface{} //
	Settings   interface{} //
	IsArchived interface{} //
	IsPinned   interface{} //
}
