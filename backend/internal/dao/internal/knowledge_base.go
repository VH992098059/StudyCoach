// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// KnowledgeBaseDao is the data access object for table knowledge_base.
type KnowledgeBaseDao struct {
	table   string               // table is the underlying table name of the DAO.
	group   string               // group is the database configuration group name of current DAO.
	columns KnowledgeBaseColumns // columns contains all the column names of Table for convenient usage.
}

// KnowledgeBaseColumns defines and stores column names for table knowledge_base.
type KnowledgeBaseColumns struct {
	Id          string // 知识库ID，主键
	Name        string // 知识库名称
	Description string // 知识库描述
	Category    string // 知识库分类
	Status      string // 状态：1-启用，2-禁用
	CreatedAt   string // 创建时间
	UpdatedAt   string // 更新时间
}

// knowledgeBaseColumns holds the columns for table knowledge_base.
var knowledgeBaseColumns = KnowledgeBaseColumns{
	Id:          "id",
	Name:        "name",
	Description: "description",
	Category:    "category",
	Status:      "status",
	CreatedAt:   "created_at",
	UpdatedAt:   "updated_at",
}

// NewKnowledgeBaseDao creates and returns a new DAO object for table data access.
func NewKnowledgeBaseDao() *KnowledgeBaseDao {
	return &KnowledgeBaseDao{
		group:   "default",
		table:   "knowledge_base",
		columns: knowledgeBaseColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *KnowledgeBaseDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *KnowledgeBaseDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *KnowledgeBaseDao) Columns() KnowledgeBaseColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *KnowledgeBaseDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *KnowledgeBaseDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *KnowledgeBaseDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
