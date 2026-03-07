// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// UserSettings is the golang structure of table user_settings for DAO operations like Where/Data.
type UserSettings struct {
	g.Meta              `orm:"table:user_settings, do:true"`
	Id                  any         //
	UserId              any         //
	Theme               any         //
	Language            any         //
	NotificationEnabled any         //
	AutoSaveSessions    any         //
	MaxSessions         any         //
	FontSize            any         //
	SettingsJson        any         //
	CreatedAt           *gtime.Time //
	UpdatedAt           *gtime.Time //
}
