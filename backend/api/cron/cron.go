// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package cron

import (
	"context"

	"backend/api/cron/v1"
)

type ICronV1 interface {
	CronCreate(ctx context.Context, req *v1.CronCreateReq) (res *v1.CronCreateRes, err error)
	CronDelete(ctx context.Context, req *v1.CronDeleteReq) (res *v1.CronDeleteRes, err error)
	CronList(ctx context.Context, req *v1.CronListReq) (res *v1.CronListRes, err error)
	CronGetOne(ctx context.Context, req *v1.CronGetOneReq) (res *v1.CronGetOneRes, err error)
	CronUpdateOne(ctx context.Context, req *v1.CronUpdateOneReq) (res *v1.CronUpdateOneRes, err error)
	CronUpdateStatus(ctx context.Context, req *v1.CronUpdateStatusReq) (res *v1.CronUpdateStatusRes, err error)
}
