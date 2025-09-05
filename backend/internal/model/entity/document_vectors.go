// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// DocumentVectors is the golang structure for table document_vectors.
type DocumentVectors struct {
	Id         string      `json:"id"         orm:"id"          description:""` //
	Content    string      `json:"content"    orm:"content"     description:""` //
	Vector     string      `json:"vector"     orm:"vector"      description:""` //
	Metadata   string      `json:"metadata"   orm:"metadata"    description:""` //
	SourceType string      `json:"sourceType" orm:"source_type" description:""` //
	CreatedAt  *gtime.Time `json:"createdAt"  orm:"created_at"  description:""` //
	UpdatedAt  *gtime.Time `json:"updatedAt"  orm:"updated_at"  description:""` //
}
