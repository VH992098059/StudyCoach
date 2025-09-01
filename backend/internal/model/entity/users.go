// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Users is the golang structure for table users.
type Users struct {
	Id           int64       `json:"id"           orm:"id"            description:""` //
	Uuid         string      `json:"uuid"         orm:"uuid"          description:""` //
	Username     string      `json:"username"     orm:"username"      description:""` //
	Email        string      `json:"email"        orm:"email"         description:""` //
	PasswordHash string      `json:"passwordHash" orm:"password_hash" description:""` //
	AvatarUrl    string      `json:"avatarUrl"    orm:"avatar_url"    description:""` //
	CreatedAt    *gtime.Time `json:"createdAt"    orm:"created_at"    description:""` //
	UpdatedAt    *gtime.Time `json:"updatedAt"    orm:"updated_at"    description:""` //
	LastLoginAt  *gtime.Time `json:"lastLoginAt"  orm:"last_login_at" description:""` //
	Status       string      `json:"status"       orm:"status"        description:""` //
}
