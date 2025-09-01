// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// KnowledgeChunksDao is the data access object for table knowledge_chunks.
type KnowledgeChunksDao struct {
	table   string                 // table is the underlying table name of the DAO.
	group   string                 // group is the database configuration group name of current DAO.
	columns KnowledgeChunksColumns // columns contains all the column names of Table for convenient usage.
}

// KnowledgeChunksColumns defines and stores column names for table knowledge_chunks.
type KnowledgeChunksColumns struct {
	Id             string //
	KnowledgeDocId string //
	ChunkId        string //
	Content        string //
	Ext            string //
	Status         string //
	CreatedAt      string //
	UpdatedAt      string //
}

// knowledgeChunksColumns holds the columns for table knowledge_chunks.
var knowledgeChunksColumns = KnowledgeChunksColumns{
	Id:             "id",
	KnowledgeDocId: "knowledge_doc_id",
	ChunkId:        "chunk_id",
	Content:        "content",
	Ext:            "ext",
	Status:         "status",
	CreatedAt:      "created_at",
	UpdatedAt:      "updated_at",
}

// NewKnowledgeChunksDao creates and returns a new DAO object for table data access.
func NewKnowledgeChunksDao() *KnowledgeChunksDao {
	return &KnowledgeChunksDao{
		group:   "default",
		table:   "knowledge_chunks",
		columns: knowledgeChunksColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *KnowledgeChunksDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *KnowledgeChunksDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *KnowledgeChunksDao) Columns() KnowledgeChunksColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *KnowledgeChunksDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *KnowledgeChunksDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *KnowledgeChunksDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
