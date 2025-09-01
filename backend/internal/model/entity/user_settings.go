// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// UserSettings is the golang structure for table user_settings.
type UserSettings struct {
	Id                  int64       `json:"id"                  orm:"id"                   description:"设置ID，主键"`                         // 设置ID，主键
	UserId              int64       `json:"userId"              orm:"user_id"              description:"用户ID，外键关联users表"`                 // 用户ID，外键关联users表
	Theme               string      `json:"theme"               orm:"theme"                description:"主题设置：light-浅色，dark-深色，auto-跟随系统"` // 主题设置：light-浅色，dark-深色，auto-跟随系统
	Language            string      `json:"language"            orm:"language"             description:"语言设置，如zh-CN, en-US等"`             // 语言设置，如zh-CN, en-US等
	NotificationEnabled bool        `json:"notificationEnabled" orm:"notification_enabled" description:"通知开关：false-关闭，true-开启"`           // 通知开关：false-关闭，true-开启
	AutoSaveSessions    bool        `json:"autoSaveSessions"    orm:"auto_save_sessions"   description:"自动保存会话：false-关闭，true-开启"`         // 自动保存会话：false-关闭，true-开启
	MaxSessions         int         `json:"maxSessions"         orm:"max_sessions"         description:"最大保存会话数量，超出后自动删除最旧的"`             // 最大保存会话数量，超出后自动删除最旧的
	FontSize            string      `json:"fontSize"            orm:"font_size"            description:"字体大小：small-小，medium-中，large-大"`   // 字体大小：small-小，medium-中，large-大
	SettingsJson        string      `json:"settingsJson"        orm:"settings_json"        description:"其他设置的JSON存储，便于扩展新功能"`             // 其他设置的JSON存储，便于扩展新功能
	CreatedAt           *gtime.Time `json:"createdAt"           orm:"created_at"           description:"设置创建时间"`                          // 设置创建时间
	UpdatedAt           *gtime.Time `json:"updatedAt"           orm:"updated_at"           description:"设置最后更新时间"`                        // 设置最后更新时间
}
