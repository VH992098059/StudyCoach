// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// DocumentVectors is the golang structure of table document_vectors for DAO operations like Where/Data.
type DocumentVectors struct {
	g.Meta     `orm:"table:document_vectors, do:true"`
	Id         any         //
	Content    any         //
	Vector     any         //
	Metadata   any         //
	SourceType any         //
	CreatedAt  *gtime.Time //
	UpdatedAt  *gtime.Time //
}
