// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
)

// Attachments is the golang structure of table attachments for DAO operations like Where/Data.
type Attachments struct {
	g.Meta         `orm:"table:attachments, do:true"`
	Id             any //
	AttachId       any //
	MessageId      any //
	AttachmentType any //
	FileName       any //
	FileSize       any //
	StorageType    any //
	StoragePath    any //
	Thumbnail      any //
	Vectorized     any //
	DataSummary    any //
	MimeType       any //
	CreatedAt      any //
}
