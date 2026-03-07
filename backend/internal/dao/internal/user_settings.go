// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// UserSettingsDao is the data access object for the table user_settings.
type UserSettingsDao struct {
	table    string              // table is the underlying table name of the DAO.
	group    string              // group is the database configuration group name of the current DAO.
	columns  UserSettingsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler  // handlers for customized model modification.
}

// UserSettingsColumns defines and stores column names for the table user_settings.
type UserSettingsColumns struct {
	Id                  string //
	UserId              string //
	Theme               string //
	Language            string //
	NotificationEnabled string //
	AutoSaveSessions    string //
	MaxSessions         string //
	FontSize            string //
	SettingsJson        string //
	CreatedAt           string //
	UpdatedAt           string //
}

// userSettingsColumns holds the columns for the table user_settings.
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
func NewUserSettingsDao(handlers ...gdb.ModelHandler) *UserSettingsDao {
	return &UserSettingsDao{
		group:    "default",
		table:    "user_settings",
		columns:  userSettingsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *UserSettingsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *UserSettingsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *UserSettingsDao) Columns() UserSettingsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *UserSettingsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *UserSettingsDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rolls back the transaction and returns the error if function f returns a non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note: Do not commit or roll back the transaction in function f,
// as it is automatically handled by this function.
func (dao *UserSettingsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
