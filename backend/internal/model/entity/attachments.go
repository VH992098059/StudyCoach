// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

// Attachments is the golang structure for table attachments.
type Attachments struct {
	Id             uint64 `json:"id"             orm:"id"              description:""` //
	AttachId       string `json:"attachId"       orm:"attach_id"       description:""` //
	MessageId      string `json:"messageId"      orm:"message_id"      description:""` //
	AttachmentType string `json:"attachmentType" orm:"attachment_type" description:""` //
	FileName       string `json:"fileName"       orm:"file_name"       description:""` //
	FileSize       int64  `json:"fileSize"       orm:"file_size"       description:""` //
	StorageType    string `json:"storageType"    orm:"storage_type"    description:""` //
	StoragePath    string `json:"storagePath"    orm:"storage_path"    description:""` //
	Thumbnail      []byte `json:"thumbnail"      orm:"thumbnail"       description:""` //
	Vectorized     int    `json:"vectorized"     orm:"vectorized"      description:""` //
	DataSummary    string `json:"dataSummary"    orm:"data_summary"    description:""` //
	MimeType       string `json:"mimeType"       orm:"mime_type"       description:""` //
	CreatedAt      int64  `json:"createdAt"      orm:"created_at"      description:""` //
}
