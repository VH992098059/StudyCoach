package gorm

import "time"

// UserSettings 用户设置表
type UserSettings struct {
	ID                  int64     `gorm:"primaryKey;column:id;autoIncrement"`       // 主键
	UserID              int64     `gorm:"column:user_id;index"`                     // 用户 ID
	Theme               string    `gorm:"column:theme;type:varchar(50)"`            // 主题（如 dark、light）
	Language            string    `gorm:"column:language;type:varchar(20)"`         // 界面语言
	NotificationEnabled bool      `gorm:"column:notification_enabled;default:true"` // 是否启用通知
	AutoSaveSessions    bool      `gorm:"column:auto_save_sessions;default:true"`   // 是否自动保存会话
	MaxSessions         int       `gorm:"column:max_sessions;default:50"`           // 最大会话数量限制
	FontSize            string    `gorm:"column:font_size;type:varchar(20)"`        // 字体大小
	SettingsJSON        string    `gorm:"column:settings_json;type:text"`           // 其他设置的 JSON 扩展
	CreatedAt           time.Time `gorm:"column:created_at;type:datetime"`          // 创建时间
	UpdatedAt           time.Time `gorm:"column:updated_at;type:datetime"`          // 更新时间
}

func (UserSettings) TableName() string {
	return "user_settings"
}
