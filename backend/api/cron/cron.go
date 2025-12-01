// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package cron

import (
	"context"

	"backend/api/cron/v1"
)

type ICronV1 interface {
	RegularUpdateCreate(ctx context.Context, req *v1.RegularUpdateCreateReq) (res *v1.RegularUpdateCreateRes, err error)
	RegularUpdateDelete(ctx context.Context, req *v1.RegularUpdateDeleteReq) (res *v1.RegularUpdateDeleteRes, err error)
}
