// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeDocuments is the golang structure of table knowledge_documents for DAO operations like Where/Data.
type KnowledgeDocuments struct {
	g.Meta            `orm:"table:knowledge_documents, do:true"`
	Id                any         //
	KnowledgeBaseName any         //
	FileName          any         //
	Status            any         //
	CreatedAt         *gtime.Time //
	UpdatedAt         *gtime.Time //
}
