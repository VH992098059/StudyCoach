// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// Users is the golang structure of table users for DAO operations like Where/Data.
type Users struct {
	g.Meta       `orm:"table:users, do:true"`
	Id           interface{} //
	Uuid         interface{} //
	Username     interface{} //
	Email        interface{} //
	PasswordHash interface{} //
	AvatarUrl    interface{} //
	CreatedAt    *gtime.Time //
	UpdatedAt    *gtime.Time //
	LastLoginAt  *gtime.Time //
	Status       interface{} //
}
