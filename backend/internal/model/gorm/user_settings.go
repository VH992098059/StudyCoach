package gorm

import "time"

// UserSettings 用户设置表
type UserSettings struct {
	ID                  string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"` // 主键（UUID）
	UserID              string    `gorm:"column:user_id;type:uuid;index"`                 // 用户 ID（users.id）
	Theme               string    `gorm:"column:theme;type:varchar(50)"`                  // 主题（如 dark、light）
	Language            string    `gorm:"column:language;type:varchar(20)"`               // 界面语言
	NotificationEnabled bool      `gorm:"column:notification_enabled;default:true"`       // 是否启用通知
	AutoSaveSessions    bool      `gorm:"column:auto_save_sessions;default:true"`         // 是否自动保存会话
	MaxSessions         int       `gorm:"column:max_sessions;default:50"`                 // 最大会话数量限制
	FontSize            string    `gorm:"column:font_size;type:varchar(20)"`              // 字体大小
	SettingsJSON        string    `gorm:"column:settings_json;type:text"`                 // 其他设置的 JSON 扩展
	CreatedAt           time.Time `gorm:"column:created_at;type:timestamp"`               // 创建时间
	UpdatedAt           time.Time `gorm:"column:updated_at;type:timestamp"`               // 更新时间
}

func (UserSettings) TableName() string {
	return "user_settings"
}
