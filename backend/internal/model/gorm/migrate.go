package gorm

import (
	"gorm.io/gorm"
)

// ExcludedTables 不参与自动创建的表。
// 注：原 chat-history 管理的 conversations/messages/attachments/message_attachments 表
// 已随 §10（移除 chat-history）一并废弃，此处保留空列表以兼容既有引用。
var ExcludedTables = []string{}

// ProjectTables 项目自有表，启动时自动迁移：表不存在则创建，已存在则仅补充缺失列。
var ProjectTables = []any{
	&User{},
	&ChatSessions{},
	&ChatMessages{},
	&KnowledgeBase{},
	&KnowledgeDocuments{},
	&KnowledgeChunks{},
	&KnowledgeBaseCronSchedule{},
	&CronLog{},
	&CronExecute{},
	&Files{},
	&UserSettings{},
	&DocumentVectors{},
}

// tableOptions 建表选项（仅 MySQL 适用）：表及所有字段继承 utf8mb4 + utf8mb4_unicode_ci
const tableOptions = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"

// AutoMigrate 自动迁移项目表：表不存在则创建，已存在则仅补充缺失列。
// PostgreSQL 不支持 ENGINE/CHARSET 表选项，故按方言跳过。
func AutoMigrate(db *gorm.DB) error {
	if db.Dialector.Name() == "postgres" {
		return db.AutoMigrate(ProjectTables...)
	}
	return db.Set("gorm:table_options", tableOptions).
		AutoMigrate(ProjectTables...)
}
