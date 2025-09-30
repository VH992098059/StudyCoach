// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ConversationsDao is the data access object for table conversations.
type ConversationsDao struct {
	table   string               // table is the underlying table name of the DAO.
	group   string               // group is the database configuration group name of current DAO.
	columns ConversationsColumns // columns contains all the column names of Table for convenient usage.
}

// ConversationsColumns defines and stores column names for table conversations.
type ConversationsColumns struct {
	Id         string //
	ConvId     string //
	Title      string //
	CreatedAt  string //
	UpdatedAt  string //
	Settings   string //
	IsArchived string //
	IsPinned   string //
}

// conversationsColumns holds the columns for table conversations.
var conversationsColumns = ConversationsColumns{
	Id:         "id",
	ConvId:     "conv_id",
	Title:      "title",
	CreatedAt:  "created_at",
	UpdatedAt:  "updated_at",
	Settings:   "settings",
	IsArchived: "is_archived",
	IsPinned:   "is_pinned",
}

// NewConversationsDao creates and returns a new DAO object for table data access.
func NewConversationsDao() *ConversationsDao {
	return &ConversationsDao{
		group:   "default",
		table:   "conversations",
		columns: conversationsColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *ConversationsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *ConversationsDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *ConversationsDao) Columns() ConversationsColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *ConversationsDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *ConversationsDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *ConversationsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
