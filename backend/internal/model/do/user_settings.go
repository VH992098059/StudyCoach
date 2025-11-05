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
	Id                  any         // 设置ID，主键
	UserId              any         // 用户ID，外键关联users表
	Theme               any         // 主题设置：light-浅色，dark-深色，auto-跟随系统
	Language            any         // 语言设置，如zh-CN, en-US等
	NotificationEnabled any         // 通知开关：false-关闭，true-开启
	AutoSaveSessions    any         // 自动保存会话：false-关闭，true-开启
	MaxSessions         any         // 最大保存会话数量，超出后自动删除最旧的
	FontSize            any         // 字体大小：small-小，medium-中，large-大
	SettingsJson        any         // 其他设置的JSON存储，便于扩展新功能
	CreatedAt           *gtime.Time // 设置创建时间
	UpdatedAt           *gtime.Time // 设置最后更新时间
}
