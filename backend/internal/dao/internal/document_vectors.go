// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// DocumentVectorsDao is the data access object for table document_vectors.
type DocumentVectorsDao struct {
	table   string                 // table is the underlying table name of the DAO.
	group   string                 // group is the database configuration group name of current DAO.
	columns DocumentVectorsColumns // columns contains all the column names of Table for convenient usage.
}

// DocumentVectorsColumns defines and stores column names for table document_vectors.
type DocumentVectorsColumns struct {
	Id         string //
	Content    string //
	Vector     string //
	Metadata   string //
	SourceType string //
	CreatedAt  string //
	UpdatedAt  string //
}

// documentVectorsColumns holds the columns for table document_vectors.
var documentVectorsColumns = DocumentVectorsColumns{
	Id:         "id",
	Content:    "content",
	Vector:     "vector",
	Metadata:   "metadata",
	SourceType: "source_type",
	CreatedAt:  "created_at",
	UpdatedAt:  "updated_at",
}

// NewDocumentVectorsDao creates and returns a new DAO object for table data access.
func NewDocumentVectorsDao() *DocumentVectorsDao {
	return &DocumentVectorsDao{
		group:   "default",
		table:   "document_vectors",
		columns: documentVectorsColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *DocumentVectorsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *DocumentVectorsDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *DocumentVectorsDao) Columns() DocumentVectorsColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *DocumentVectorsDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *DocumentVectorsDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *DocumentVectorsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
