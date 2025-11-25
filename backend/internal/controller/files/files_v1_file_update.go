package files

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/files/v1"
)

func (c *ControllerV1) FileUpdate(ctx context.Context, req *v1.FileUpdateReq) (res *v1.FileUpdateRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
