// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Users is the golang structure for table users.
type Users struct {
	Id          uint64      `json:"id"          orm:"id"            description:"用户ID，主键"`                               // 用户ID，主键
	Uuid        string      `json:"uuid"        orm:"uuid"          description:"用户UUID"`                                // 用户UUID
	Username    string      `json:"username"    orm:"username"      description:"用户名，唯一标识"`                              // 用户名，唯一标识
	Email       string      `json:"email"       orm:"email"         description:"用户邮箱，用于登录和通知"`                          // 用户邮箱，用于登录和通知
	Password    string      `json:"password"    orm:"password"      description:"密码哈希值，使用bcrypt等安全算法"`                   // 密码哈希值，使用bcrypt等安全算法
	AvatarUrl   string      `json:"avatarUrl"   orm:"avatar_url"    description:"用户头像URL地址"`                             // 用户头像URL地址
	CreatedAt   *gtime.Time `json:"createdAt"   orm:"created_at"    description:"账户创建时间"`                                // 账户创建时间
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"    description:"最后更新时间"`                                // 最后更新时间
	LastLoginAt *gtime.Time `json:"lastLoginAt" orm:"last_login_at" description:"最后登录时间"`                                // 最后登录时间
	LogoutAt    *gtime.Time `json:"logoutAt"    orm:"logout_at"     description:"退出时间"`                                  // 退出时间
	Status      string      `json:"status"      orm:"status"        description:"账户状态：active-活跃，inactive-未激活，banned-封禁"` // 账户状态：active-活跃，inactive-未激活，banned-封禁
}
