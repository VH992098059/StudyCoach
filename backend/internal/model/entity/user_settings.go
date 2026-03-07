// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// UserSettings is the golang structure for table user_settings.
type UserSettings struct {
	Id                  int64       `json:"id"                  orm:"id"                   description:""` //
	UserId              int64       `json:"userId"              orm:"user_id"              description:""` //
	Theme               string      `json:"theme"               orm:"theme"                description:""` //
	Language            string      `json:"language"            orm:"language"             description:""` //
	NotificationEnabled int         `json:"notificationEnabled" orm:"notification_enabled" description:""` //
	AutoSaveSessions    int         `json:"autoSaveSessions"    orm:"auto_save_sessions"   description:""` //
	MaxSessions         int64       `json:"maxSessions"         orm:"max_sessions"         description:""` //
	FontSize            string      `json:"fontSize"            orm:"font_size"            description:""` //
	SettingsJson        string      `json:"settingsJson"        orm:"settings_json"        description:""` //
	CreatedAt           *gtime.Time `json:"createdAt"           orm:"created_at"           description:""` //
	UpdatedAt           *gtime.Time `json:"updatedAt"           orm:"updated_at"           description:""` //
}
