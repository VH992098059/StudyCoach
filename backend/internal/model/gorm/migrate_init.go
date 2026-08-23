package gorm

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/frame/g"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// RunMigrateOnStartup 启动时执行数据库迁移（PostgreSQL）。
// 仅迁移 ProjectTables 中的表：表不存在则创建，已存在则仅补充缺失列。
func RunMigrateOnStartup(ctx context.Context) error {
	dsn, err := g.Cfg().Get(ctx, "db.pgsql")
	if err != nil || dsn.String() == "" {
		g.Log().Warningf(ctx, "db.pgsql not configured, skip migrate: %v", err)
		return nil
	}
	// gorm postgres DSN 格式：host=... user=... password=... dbname=... port=... sslmode=... TimeZone=...
	// 目标库不存在时先自动创建（库名取自 DSN 的 dbname），再执行表迁移
	if err := ensureDatabase(ctx, dsn.String()); err != nil {
		return err
	}
	db, err := gorm.Open(postgres.Open(dsn.String()), &gorm.Config{
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
