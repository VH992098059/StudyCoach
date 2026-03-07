package gorm

import (
	"gorm.io/gorm"
)

// ExcludedTables 不参与自动创建的表，由 chat-history 创建并维护。
// 参考: https://github.com/VH992098059/chat-history/blob/main/models/models.go
// - conversations, messages, attachments, message_attachments
var ExcludedTables = []string{
	"conversations", "messages", "attachments", "message_attachments",
}

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

// tableOptions 建表选项：表及所有字段继承 utf8mb4 + utf8mb4_unicode_ci
const tableOptions = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"

// AutoMigrate 自动迁移项目表：表不存在则创建，已存在则仅补充缺失列
func AutoMigrate(db *gorm.DB) error {
	return db.Set("gorm:table_options", tableOptions).
		AutoMigrate(ProjectTables...)
}
