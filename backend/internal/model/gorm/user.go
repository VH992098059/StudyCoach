package gorm

import "time"

// User 用户表模型
type User struct {
	ID          int64      `gorm:"primaryKey;autoIncrement"`
	UUID        string     `gorm:"type:varchar(255);index:uuid"`
	Username    string     `gorm:"type:varchar(50);not null;uniqueIndex:uk_username"`
	Email       string     `gorm:"type:varchar(100);not null;uniqueIndex:uk_email"`
	Password    string     `gorm:"type:varchar(255);not null"`
	AvatarURL   string     `gorm:"type:varchar(500)"`
	CreatedAt   *time.Time `gorm:"type:timestamp;default:null"`
	UpdatedAt   *time.Time `gorm:"type:timestamp;default:null"`
	LastLoginAt *time.Time `gorm:"type:timestamp;default:null;index:idx_last_login"`
	LogoutAt    *time.Time `gorm:"type:timestamp;default:null;index:idx_logout"`
	Status      string     `gorm:"type:enum('active','inactive','banned');index:idx_status"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
