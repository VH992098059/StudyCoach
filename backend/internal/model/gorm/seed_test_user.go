package gorm

import (
	"context"
	"strings"

	"backend/utility"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// 默认测试账号（新建库后自动插入一条，避免反复注册；已存在同名用户则跳过）
const (
	seedTestUsername = "test"
	seedTestPassword = "abc@123"
	seedTestEmail    = "test@localhost.local" // 占位邮箱，满足 users 表唯一约束
)

func seedTestUserIfAbsent(ctx context.Context, db *gorm.DB) error {
	var count int64
	if err := db.Model(&User{}).Where("username = ?", seedTestUsername).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	pwd, err := utility.Encrypt(seedTestPassword)
	if err != nil {
		return err
	}
	uid := strings.ReplaceAll(uuid.New().String(), "-", "")
	u := User{
		UUID:      uid,
		Username:  seedTestUsername,
		Email:     seedTestEmail,
		Password:  pwd,
		AvatarURL: "avatar.png",
		Status:    "active",
	}
	if err := db.Create(&u).Error; err != nil {
		return err
	}
	g.Log().Infof(ctx, "已插入默认测试账号: username=%s email=%s（本地/开发用）", seedTestUsername, seedTestEmail)
	return nil
}
