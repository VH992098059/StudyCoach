// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// KnowledgeBaseCronScheduleDao is the data access object for table knowledge_base_cron_schedule.
type KnowledgeBaseCronScheduleDao struct {
	table   string                           // table is the underlying table name of the DAO.
	group   string                           // group is the database configuration group name of current DAO.
	columns KnowledgeBaseCronScheduleColumns // columns contains all the column names of Table for convenient usage.
}

// KnowledgeBaseCronScheduleColumns defines and stores column names for table knowledge_base_cron_schedule.
type KnowledgeBaseCronScheduleColumns struct {
	Id              string //
	KnowledgeBaseId string //
	CronExpression  string //
	CreatedAt       string //
	UpdatedAt       string //
}

// knowledgeBaseCronScheduleColumns holds the columns for table knowledge_base_cron_schedule.
var knowledgeBaseCronScheduleColumns = KnowledgeBaseCronScheduleColumns{
	Id:              "id",
	KnowledgeBaseId: "knowledge_base_id",
	CronExpression:  "cron_expression",
	CreatedAt:       "created_at",
	UpdatedAt:       "updated_at",
}

// NewKnowledgeBaseCronScheduleDao creates and returns a new DAO object for table data access.
func NewKnowledgeBaseCronScheduleDao() *KnowledgeBaseCronScheduleDao {
	return &KnowledgeBaseCronScheduleDao{
		group:   "default",
		table:   "knowledge_base_cron_schedule",
		columns: knowledgeBaseCronScheduleColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *KnowledgeBaseCronScheduleDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *KnowledgeBaseCronScheduleDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *KnowledgeBaseCronScheduleDao) Columns() KnowledgeBaseCronScheduleColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *KnowledgeBaseCronScheduleDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *KnowledgeBaseCronScheduleDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *KnowledgeBaseCronScheduleDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
