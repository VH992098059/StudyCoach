// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// MessagesDao is the data access object for the table messages.
type MessagesDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  MessagesColumns    // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// MessagesColumns defines and stores column names for the table messages.
type MessagesColumns struct {
	Id             string //
	MsgId          string //
	ConversationId string //
	ParentId       string //
	Role           string //
	Content        string //
	CreatedAt      string //
	OrderSeq       string //
	TokenCount     string //
	Status         string //
	Metadata       string //
	IsContextEdge  string //
	IsVariant      string //
}

// messagesColumns holds the columns for the table messages.
var messagesColumns = MessagesColumns{
	Id:             "id",
	MsgId:          "msg_id",
	ConversationId: "conversation_id",
	ParentId:       "parent_id",
	Role:           "role",
	Content:        "content",
	CreatedAt:      "created_at",
	OrderSeq:       "order_seq",
	TokenCount:     "token_count",
	Status:         "status",
	Metadata:       "metadata",
	IsContextEdge:  "is_context_edge",
	IsVariant:      "is_variant",
}

// NewMessagesDao creates and returns a new DAO object for table data access.
func NewMessagesDao(handlers ...gdb.ModelHandler) *MessagesDao {
	return &MessagesDao{
		group:    "default",
		table:    "messages",
		columns:  messagesColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *MessagesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *MessagesDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *MessagesDao) Columns() MessagesColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *MessagesDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *MessagesDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *MessagesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
