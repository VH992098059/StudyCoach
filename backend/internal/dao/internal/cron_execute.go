// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// CronExecuteDao is the data access object for the table cron_execute.
type CronExecuteDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  CronExecuteColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// CronExecuteColumns defines and stores column names for the table cron_execute.
type CronExecuteColumns struct {
	Id          string //
	CronNameFk  string // 定时任务名
	ExecuteTime string // 执行时间
	NextTime    string // 下次执行时间
	CreatedAt   string //
	UpdatedAt   string //
}

// cronExecuteColumns holds the columns for the table cron_execute.
var cronExecuteColumns = CronExecuteColumns{
	Id:          "id",
	CronNameFk:  "cron_name_fk",
	ExecuteTime: "execute_time",
	NextTime:    "next_time",
	CreatedAt:   "created_at",
	UpdatedAt:   "updated_at",
}

// NewCronExecuteDao creates and returns a new DAO object for table data access.
func NewCronExecuteDao(handlers ...gdb.ModelHandler) *CronExecuteDao {
	return &CronExecuteDao{
		group:    "default",
		table:    "cron_execute",
		columns:  cronExecuteColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *CronExecuteDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *CronExecuteDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *CronExecuteDao) Columns() CronExecuteColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *CronExecuteDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *CronExecuteDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *CronExecuteDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
