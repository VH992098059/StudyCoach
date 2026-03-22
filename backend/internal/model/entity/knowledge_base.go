// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// KnowledgeBase is the golang structure for table knowledge_base.
type KnowledgeBase struct {
	Id          int64       `json:"id"          orm:"id"          description:""` //
	UserUuid    string      `json:"userUuid"    orm:"user_uuid"   description:""` //
	Name        string      `json:"name"        orm:"name"        description:""` //
	Description string      `json:"description" orm:"description" description:""` //
	Category    string      `json:"category"    orm:"category"    description:""` //
	Status      int64       `json:"status"      orm:"status"      description:""` //
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"  description:""` //
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"  description:""` //
}
