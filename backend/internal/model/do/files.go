// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// Files is the golang structure of table files for DAO operations like Where/Data.
type Files struct {
	g.Meta         `orm:"table:files, do:true"`
	Id             any         // 文件ID
	Filename       any         // 文件名
	Size           any         // 文件大小
	ConversationId any         // 对话ID
	CreateAt       *gtime.Time // 创建时间
	UpdateAt       *gtime.Time // 修改时间
	DeleteAt       *gtime.Time // 软删除
}
