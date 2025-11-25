package v1

import (
	"backend/internal/model/entity"

	"github.com/gogf/gf/v2/frame/g"
)

type FilesGetAllReq struct {
	g.Meta `path:"/file" method:"get"`
	Page   int `p:"page" dc:"page" v:"required|min:1" d:"1"`
	Size   int `p:"size" dc:"size" v:"required|min:1|max:100" d:"10"`
}
type FilesGetAllRes struct {
	g.Meta `mime:"application/json"`
	List   []*entity.Files `json:"list"`
}
type FileUpdateReq struct {
	g.Meta   `path:"/file" method:"put"`
	Filename string `json:"filename"`
	Filesize int64  `json:"filesize"`
}
type FileUpdateRes struct {
	g.Meta  `mime:"application/json"`
	Success string `json:"success"`
}
type FileOnDeleteReq struct {
	g.Meta `path:"/file" method:"delete"`
	Id     int8 `json:"id"`
}
type FileOnDeleteRes struct {
	g.Meta  `mime:"application/json"`
	Success string `json:"success"`
}
type FileOnInsertReq struct {
	g.Meta   `path:"/file" method:"post"`
	Filename string `json:"filename"`
	Filesize int64  `json:"filesize"`
}
type FileOnInsertRes struct {
	g.Meta  `mime:"application/json"`
	Success string `json:"success"`
}
