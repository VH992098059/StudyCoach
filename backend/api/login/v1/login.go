package v1

import "github.com/gogf/gf/v2/frame/g"

type LoginReq struct {
	g.Meta   `path:"users/login" method:"post" sm:"登录"`
	Username string `json:"username" v:"required|length:6,30"`
	Password string `json:"password" v:"required|length:6,20"`
}
type LoginRes struct {
	g.Meta `mime:"application/json"`
	Id     uint64 `json:"id"`
	Uuid   string `json:"uuid"`
	Token  string `json:"token" dc:"在需要鉴权的接口中header加入Authorization: token"`
}
type RegisterReq struct {
	g.Meta   `path:"users/register" method:"post" sm:"注册"`
	Username string `json:"username" v:"required|length:6,30"`
	Password string `json:"password" v:"required|length:6,20"`
	Email    string `json:"email" v:"required|length:6,30"`
}
type RegisterRes struct {
	g.Meta `mime:"application/json"`
	Id     int64 `json:"id"`
}

type LogoutReq struct {
	g.Meta `path:"users/logout" method:"post" sm:"退出登录"`
}
type LogoutRes struct {
	Msg string `json:"msg"`
}
