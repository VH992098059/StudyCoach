// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// KnowledgeBaseCronScheduleDao is the data access object for the table knowledge_base_cron_schedule.
type KnowledgeBaseCronScheduleDao struct {
	table    string                           // table is the underlying table name of the DAO.
	group    string                           // group is the database configuration group name of the current DAO.
	columns  KnowledgeBaseCronScheduleColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler               // handlers for customized model modification.
}

// KnowledgeBaseCronScheduleColumns defines and stores column names for the table knowledge_base_cron_schedule.
type KnowledgeBaseCronScheduleColumns struct {
	Id                string //
	CronName          string // 定时任务名
	KnowledgeBaseName string // 知识库id
	SchedulingMethod  string // 调度方式
	CronExpression    string // cron表达式
	Status            string // 使用状态 1启用，2暂停，0停止
	ContentType       string // 更新内容状态 1为全量更新，2为增量更新
	CreatedAt         string //
	UpdatedAt         string //
	DeletedAt         string //
}

// knowledgeBaseCronScheduleColumns holds the columns for the table knowledge_base_cron_schedule.
var knowledgeBaseCronScheduleColumns = KnowledgeBaseCronScheduleColumns{
	Id:                "id",
	CronName:          "cron_name",
	KnowledgeBaseName: "knowledge_base_name",
	SchedulingMethod:  "scheduling_method",
	CronExpression:    "cron_expression",
	Status:            "status",
	ContentType:       "content_type",
	CreatedAt:         "created_at",
	UpdatedAt:         "updated_at",
	DeletedAt:         "deleted_at",
}

// NewKnowledgeBaseCronScheduleDao creates and returns a new DAO object for table data access.
func NewKnowledgeBaseCronScheduleDao(handlers ...gdb.ModelHandler) *KnowledgeBaseCronScheduleDao {
	return &KnowledgeBaseCronScheduleDao{
		group:    "default",
		table:    "knowledge_base_cron_schedule",
		columns:  knowledgeBaseCronScheduleColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *KnowledgeBaseCronScheduleDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *KnowledgeBaseCronScheduleDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *KnowledgeBaseCronScheduleDao) Columns() KnowledgeBaseCronScheduleColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *KnowledgeBaseCronScheduleDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *KnowledgeBaseCronScheduleDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *KnowledgeBaseCronScheduleDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
