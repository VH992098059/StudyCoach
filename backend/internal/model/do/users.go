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
	g.Meta      `orm:"table:users, do:true"`
	Id          any         // 用户ID，主键
	Uuid        any         // 用户UUID
	Username    any         // 用户名，唯一标识
	Email       any         // 用户邮箱，用于登录和通知
	Password    any         // 密码哈希值，使用bcrypt等安全算法
	AvatarUrl   any         // 用户头像URL地址
	CreatedAt   *gtime.Time // 账户创建时间
	UpdatedAt   *gtime.Time // 最后更新时间
	LastLoginAt *gtime.Time // 最后登录时间
	LogoutAt    *gtime.Time // 退出时间
	Status      any         // 账户状态：active-活跃，inactive-未激活，banned-封禁
}
