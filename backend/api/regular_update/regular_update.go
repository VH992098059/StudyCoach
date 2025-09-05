// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package regular_update

import (
	"context"

	"backend/api/regular_update/v1"
)

type IRegularUpdateV1 interface {
	RegularUpdateCreate(ctx context.Context, req *v1.RegularUpdateCreateReq) (res *v1.RegularUpdateCreateRes, err error)
	RegularUpdateDelete(ctx context.Context, req *v1.RegularUpdateDeleteReq) (res *v1.RegularUpdateDeleteRes, err error)
}
