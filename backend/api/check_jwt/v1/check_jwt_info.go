package v1

import "github.com/gogf/gf/v2/frame/g"

type CheckJwtInfoReq struct {
	g.Meta `path:"/jwt_info" method:"get" summary:"check jwt" tags:"jwt"`
}
type CheckJwtInfoRes struct {
	Msg string `json:"msg"`
}
