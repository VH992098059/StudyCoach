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
	Id             interface{} //
	AttachId       interface{} //
	MessageId      interface{} //
	AttachmentType interface{} //
	FileName       interface{} //
	FileSize       interface{} //
	StorageType    interface{} //
	StoragePath    interface{} //
	Thumbnail      interface{} //
	Vectorized     interface{} //
	DataSummary    interface{} //
	MimeType       interface{} //
	CreatedAt      interface{} //
}
