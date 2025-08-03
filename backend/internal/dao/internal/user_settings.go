// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// UserSettingsDao is the data access object for table user_settings.
type UserSettingsDao struct {
	table   string              // table is the underlying table name of the DAO.
	group   string              // group is the database configuration group name of current DAO.
	columns UserSettingsColumns // columns contains all the column names of Table for convenient usage.
}

// UserSettingsColumns defines and stores column names for table user_settings.
type UserSettingsColumns struct {
	Id                  string // 设置ID，主键
	UserId              string // 用户ID，外键关联users表
	Theme               string // 主题设置：light-浅色，dark-深色，auto-跟随系统
	Language            string // 语言设置，如zh-CN, en-US等
	NotificationEnabled string // 通知开关：0-关闭，1-开启
	AutoSaveSessions    string // 自动保存会话：0-关闭，1-开启
	MaxSessions         string // 最大保存会话数量，超出后自动删除最旧的
	FontSize            string // 字体大小：small-小，medium-中，large-大
	SettingsJson        string // 其他设置的JSON存储，便于扩展新功能
	CreatedAt           string // 设置创建时间
	UpdatedAt           string // 设置最后更新时间
}

// userSettingsColumns holds the columns for table user_settings.
var userSettingsColumns = UserSettingsColumns{
	Id:                  "id",
	UserId:              "user_id",
	Theme:               "theme",
	Language:            "language",
	NotificationEnabled: "notification_enabled",
	AutoSaveSessions:    "auto_save_sessions",
	MaxSessions:         "max_sessions",
	FontSize:            "font_size",
	SettingsJson:        "settings_json",
	CreatedAt:           "created_at",
	UpdatedAt:           "updated_at",
}

// NewUserSettingsDao creates and returns a new DAO object for table data access.
func NewUserSettingsDao() *UserSettingsDao {
	return &UserSettingsDao{
		group:   "default",
		table:   "user_settings",
		columns: userSettingsColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *UserSettingsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *UserSettingsDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *UserSettingsDao) Columns() UserSettingsColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *UserSettingsDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *UserSettingsDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *UserSettingsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
