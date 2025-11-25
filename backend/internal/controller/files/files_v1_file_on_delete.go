package files

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/files/v1"
)

func (c *ControllerV1) FileOnDelete(ctx context.Context, req *v1.FileOnDeleteReq) (res *v1.FileOnDeleteRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
