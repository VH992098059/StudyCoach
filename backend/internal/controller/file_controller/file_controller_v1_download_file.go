package file_controller

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/file_controller/v1"
)

func (c *ControllerV1) DownloadFile(ctx context.Context, req *v1.DownloadFileReq) (res *v1.DownloadFileRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
