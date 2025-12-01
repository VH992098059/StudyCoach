// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

// MessageAttachments is the golang structure for table message_attachments.
type MessageAttachments struct {
	Id           uint64 `json:"id"           orm:"id"            description:""` //
	MessageId    string `json:"messageId"    orm:"message_id"    description:""` //
	AttachmentId string `json:"attachmentId" orm:"attachment_id" description:""` //
}
