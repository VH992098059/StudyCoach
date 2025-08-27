package rag

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"backend/api/rag/v1"
)

func (c *ControllerV1) ChunkDelete(ctx context.Context, req *v1.ChunkDeleteReq) (res *v1.ChunkDeleteRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
