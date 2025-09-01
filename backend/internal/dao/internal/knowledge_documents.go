// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// KnowledgeDocumentsDao is the data access object for table knowledge_documents.
type KnowledgeDocumentsDao struct {
	table   string                    // table is the underlying table name of the DAO.
	group   string                    // group is the database configuration group name of current DAO.
	columns KnowledgeDocumentsColumns // columns contains all the column names of Table for convenient usage.
}

// KnowledgeDocumentsColumns defines and stores column names for table knowledge_documents.
type KnowledgeDocumentsColumns struct {
	Id                string //
	KnowledgeBaseName string //
	FileName          string //
	Status            string //
	CreatedAt         string //
	UpdatedAt         string //
}

// knowledgeDocumentsColumns holds the columns for table knowledge_documents.
var knowledgeDocumentsColumns = KnowledgeDocumentsColumns{
	Id:                "id",
	KnowledgeBaseName: "knowledge_base_name",
	FileName:          "file_name",
	Status:            "status",
	CreatedAt:         "created_at",
	UpdatedAt:         "updated_at",
}

// NewKnowledgeDocumentsDao creates and returns a new DAO object for table data access.
func NewKnowledgeDocumentsDao() *KnowledgeDocumentsDao {
	return &KnowledgeDocumentsDao{
		group:   "default",
		table:   "knowledge_documents",
		columns: knowledgeDocumentsColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *KnowledgeDocumentsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *KnowledgeDocumentsDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *KnowledgeDocumentsDao) Columns() KnowledgeDocumentsColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *KnowledgeDocumentsDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *KnowledgeDocumentsDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *KnowledgeDocumentsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
