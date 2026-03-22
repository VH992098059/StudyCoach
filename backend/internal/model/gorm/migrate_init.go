package gorm

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/frame/g"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// RunMigrateOnStartup 启动时执行数据库迁移。
// 仅迁移 ProjectTables 中的表：表不存在则创建，已存在则仅补充缺失列。
// ExcludedTables（chat-history 管理的表）不参与迁移。
func RunMigrateOnStartup(ctx context.Context) error {
	dsn, err := g.Cfg().Get(ctx, "db.mysql")
	if err != nil || dsn.String() == "" {
		g.Log().Warningf(ctx, "db.mysql not configured, skip migrate: %v", err)
		return nil
	}
	// DSN 格式: mysql:user:pass@tcp(host:port)/db?params -> user:pass@tcp(host:port)/db?params
	connStr := strings.TrimPrefix(dsn.String(), "mysql:")
	if connStr == dsn.String() {
		connStr = dsn.String()
	}
	// 确保连接和表字段使用 utf8mb4 + utf8mb4_unicode_ci
	if strings.Contains(connStr, "?") {
		connStr += "&charset=utf8mb4"
	} else {
		connStr += "?charset=utf8mb4"
	}
	db, err := gorm.Open(mysql.Open(connStr), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return err
	}

	// 迁移前检查：哪些表需要创建
	migrator := db.Migrator()
	var tablesToCreate []string
	for _, model := range ProjectTables {
		if !migrator.HasTable(model) {
			stmt := &gorm.Statement{DB: db}
			if err := stmt.Parse(model); err == nil && stmt.Schema != nil {
				tablesToCreate = append(tablesToCreate, stmt.Schema.Table)
			}
		}
	}

	if len(tablesToCreate) > 0 {
		g.Log().Infof(ctx, "需要创建表: %s，正在执行迁移...", strings.Join(tablesToCreate, ", "))
	} else {
		g.Log().Info(ctx, "表已存在，无需建表")
	}

	if err := AutoMigrate(db); err != nil {
		return err
	}

	if err := seedTestUserIfAbsent(ctx, db); err != nil {
		g.Log().Warningf(ctx, "插入默认 test 用户失败（可忽略或检查 users 表）: %v", err)
	}

	if len(tablesToCreate) > 0 {
		g.Log().Infof(ctx, "已创建表: %s，database migrate completed", strings.Join(tablesToCreate, ", "))
	} else {
		g.Log().Info(ctx, "database migrate completed")
	}
	return nil
}
