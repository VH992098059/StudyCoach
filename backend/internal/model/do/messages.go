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
	Id             any //
	MsgId          any //
	ConversationId any //
	ParentId       any //
	Role           any //
	Content        any //
	CreatedAt      any //
	OrderSeq       any //
	TokenCount     any //
	Status         any //
	Metadata       any //
	IsContextEdge  any //
	IsVariant      any //
}
