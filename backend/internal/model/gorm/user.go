package gorm

import "time"

// User 用户表
type User struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`    // 主键（UUID）
	Username    string     `gorm:"type:varchar(50);not null;uniqueIndex:uk_username"` // 用户名
	Email       string     `gorm:"type:varchar(100);not null;uniqueIndex:uk_email"`   // 邮箱
	Password    string     `gorm:"type:varchar(255);not null"`                        // 密码（加密存储）
	AvatarURL   string     `gorm:"type:varchar(500)"`                                 // 头像 URL
	CreatedAt   *time.Time `gorm:"type:timestamp;default:null"`                       // 创建时间
	UpdatedAt   *time.Time `gorm:"type:timestamp;default:null"`                       // 更新时间
	LastLoginAt *time.Time `gorm:"type:timestamp;default:null;index:idx_last_login"`  // 最后登录时间
	LogoutAt    *time.Time `gorm:"type:timestamp;default:null;index:idx_logout"`      // 最后登出时间
	Status      string     `gorm:"type:varchar(20);index:idx_status"`                 // 账号状态：active 正常，inactive 未激活，banned 封禁
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
