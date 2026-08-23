package gorm

import (
	"context"
	"fmt"
	"strings"

	"github.com/gogf/gf/v2/frame/g"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ensureDatabase 确保目标数据库存在，不存在则通过维护库（postgres）自动创建。
// dsn 为 gorm postgres 格式：host=... user=... password=... dbname=... port=... ...
// 数据库已存在、或目标即维护库本身时为 no-op。
func ensureDatabase(ctx context.Context, dsn string) error {
	dbname := dsnFieldValue(dsn, "dbname")
	if !needCreateDatabase(dbname) {
		return nil
	}

	admin, err := gorm.Open(postgres.Open(withDbName(dsn, "postgres")), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("连接维护库 postgres 失败: %w", err)
	}
	defer func() {
		if sqlDB, dbErr := admin.DB(); dbErr == nil {
			_ = sqlDB.Close()
		}
	}()

	var count int64
	if err := admin.Raw("SELECT COUNT(1) FROM pg_database WHERE datname = ?", dbname).Scan(&count).Error; err != nil {
		return fmt.Errorf("查询数据库 %s 是否存在失败: %w", dbname, err)
	}
	if count > 0 {
		return nil
	}

	// CREATE DATABASE 不支持参数绑定，标识符需手工转义。
	if err := admin.Exec(fmt.Sprintf("CREATE DATABASE %s", quoteIdent(dbname))).Error; err != nil {
		return fmt.Errorf("创建数据库 %s 失败: %w", dbname, err)
	}
	g.Log().Infof(ctx, "数据库 %s 不存在，已自动创建", dbname)
	return nil
}

type dsnField struct {
	key, value string
}

// parseDSNFields 解析空格分隔的 key=value DSN 为有序字段列表。
// 注意：值本身不能含空格（pgx DSN 格式限制）。
func parseDSNFields(dsn string) []dsnField {
	var fields []dsnField
	for _, part := range strings.Fields(dsn) {
		if k, v, ok := strings.Cut(part, "="); ok && k != "" {
			fields = append(fields, dsnField{k, v})
		}
	}
	return fields
}

func dsnFieldValue(dsn, key string) string {
	for _, f := range parseDSNFields(dsn) {
		if f.key == key {
			return f.value
		}
	}
	return ""
}

// withDbName 返回 dbname 替换为 name 的 DSN；原 DSN 无 dbname 字段时追加。
func withDbName(dsn, name string) string {
	fields := parseDSNFields(dsn)
	replaced := false
	parts := make([]string, 0, len(fields)+1)
	for _, f := range fields {
		if f.key == "dbname" {
			f.value = name
			replaced = true
		}
		parts = append(parts, f.key+"="+f.value)
	}
	if !replaced {
		parts = append(parts, "dbname="+name)
	}
	return strings.Join(parts, " ")
}

// needCreateDatabase 目标库是否需要存在性检查/创建。
// 空值（pgx 默认以用户名为库名）与维护库本身跳过。
func needCreateDatabase(dbname string) bool {
	switch dbname {
	case "", "postgres", "template1":
		return false
	}
	return true
}

// quoteIdent 将字符串转为带双引号的 PostgreSQL 安全标识符。
func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}
