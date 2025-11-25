package files

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/files/v1"
)

func (c *ControllerV1) FileOnInsert(ctx context.Context, req *v1.FileOnInsertReq) (res *v1.FileOnInsertRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
