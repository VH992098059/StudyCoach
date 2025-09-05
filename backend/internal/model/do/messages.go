// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
)

// Messages is the golang structure of table messages for DAO operations like Where/Data.
type Messages struct {
	g.Meta         `orm:"table:messages, do:true"`
	Id             interface{} //
	MsgId          interface{} //
	ConversationId interface{} //
	ParentId       interface{} //
	Role           interface{} //
	Content        interface{} //
	CreatedAt      interface{} //
	OrderSeq       interface{} //
	TokenCount     interface{} //
	Status         interface{} //
	Metadata       interface{} //
	IsContextEdge  interface{} //
	IsVariant      interface{} //
}
