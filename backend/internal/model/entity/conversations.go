// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

// Conversations is the golang structure for table conversations.
type Conversations struct {
	Id         uint64 `json:"id"         orm:"id"          description:""` //
	ConvId     string `json:"convId"     orm:"conv_id"     description:""` //
	Title      string `json:"title"      orm:"title"       description:""` //
	CreatedAt  int64  `json:"createdAt"  orm:"created_at"  description:""` //
	UpdatedAt  int64  `json:"updatedAt"  orm:"updated_at"  description:""` //
	Settings   string `json:"settings"   orm:"settings"    description:""` //
	IsArchived int    `json:"isArchived" orm:"is_archived" description:""` //
	IsPinned   int    `json:"isPinned"   orm:"is_pinned"   description:""` //
}
