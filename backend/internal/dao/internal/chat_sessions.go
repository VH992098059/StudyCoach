// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// ChatSessionsDao is the data access object for table chat_sessions.
type ChatSessionsDao struct {
	table   string              // table is the underlying table name of the DAO.
	group   string              // group is the database configuration group name of current DAO.
	columns ChatSessionsColumns // columns contains all the column names of Table for convenient usage.
}

// ChatSessionsColumns defines and stores column names for table chat_sessions.
type ChatSessionsColumns struct {
	Id             string // 会话ID，主键
	UserId         string // 用户ID，外键关联users表
	ConversationId string // 对话ID，关联chat_history.messages表的conversation_id
	Title          string // 会话标题，默认为"新对话"
	CreatedAt      string // 会话创建时间
	UpdatedAt      string // 会话最后更新时间
	MessageCount   string // 消息数量，冗余字段便于快速查询
	IsDeleted      string // 软删除标记：0-正常，1-已删除
}

// chatSessionsColumns holds the columns for table chat_sessions.
var chatSessionsColumns = ChatSessionsColumns{
	Id:             "id",
	UserId:         "user_id",
	ConversationId: "conversation_id",
	Title:          "title",
	CreatedAt:      "created_at",
	UpdatedAt:      "updated_at",
	MessageCount:   "message_count",
	IsDeleted:      "is_deleted",
}

// NewChatSessionsDao creates and returns a new DAO object for table data access.
func NewChatSessionsDao() *ChatSessionsDao {
	return &ChatSessionsDao{
		group:   "default",
		table:   "chat_sessions",
		columns: chatSessionsColumns,
	}
}

// DB retrieves and returns the underlying raw database management object of current DAO.
func (dao *ChatSessionsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of current dao.
func (dao *ChatSessionsDao) Table() string {
	return dao.table
}

// Columns returns all column names of current dao.
func (dao *ChatSessionsDao) Columns() ChatSessionsColumns {
	return dao.columns
}

// Group returns the configuration group name of database of current dao.
func (dao *ChatSessionsDao) Group() string {
	return dao.group
}

// Ctx creates and returns the Model for current DAO, It automatically sets the context for current operation.
func (dao *ChatSessionsDao) Ctx(ctx context.Context) *gdb.Model {
	return dao.DB().Model(dao.table).Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rollbacks the transaction and returns the error from function f if it returns non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note that, you should not Commit or Rollback the transaction in function f
// as it is automatically handled by this function.
func (dao *ChatSessionsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
