// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package check_jwt

import (
	"context"

	"backend/api/check_jwt/v1"
)

type ICheckJwtV1 interface {
	CheckJwtInfo(ctx context.Context, req *v1.CheckJwtInfoReq) (res *v1.CheckJwtInfoRes, err error)
}
