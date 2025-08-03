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
	Id           interface{} // 用户ID，主键
	Uuid         interface{} // 用户UUID
	Username     interface{} // 用户名，唯一标识
	Email        interface{} // 用户邮箱，用于登录和通知
	PasswordHash interface{} // 密码哈希值，使用bcrypt等安全算法
	AvatarUrl    interface{} // 用户头像URL地址
	CreatedAt    *gtime.Time // 账户创建时间
	UpdatedAt    *gtime.Time // 最后更新时间
	LastLoginAt  *gtime.Time // 最后登录时间
	Status       interface{} // 账户状态：active-活跃，inactive-未激活，banned-封禁
}
