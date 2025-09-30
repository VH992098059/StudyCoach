package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

type UploadFileReq struct {
	g.Meta     `path:"upload" method:"POST" tags:"file" sm:"文件上传"`
	UploadFile *ghttp.UploadFile `json:"upload_file" v:"required"`
}
type UploadFileRes struct {
	g.Meta  `mime:"multipart/form-data"`
	FileURL string `json:"file_url"`
	//Filename string `json:"filename"`
	Size string `json:"size"`
}
type DownloadFileReq struct {
	g.Meta `path:"download" method:"GET" tags:"file" sm:"文件下载"`
}
type DownloadFileRes struct {
	g.Meta `mime:"multipart/form-data"`
}
