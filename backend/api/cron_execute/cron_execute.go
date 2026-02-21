// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package cron_execute

import (
	"context"

	v1 "backend/api/cron_execute/v1"
)

type ICronExecuteV1 interface {
	CronExecuteCreate(ctx context.Context, req *v1.CronExecuteCreateReq) (res *v1.CronExecuteCreateRes, err error)
	CronExecuteList(ctx context.Context, req *v1.CronExecuteListReq) (res *v1.CronExecuteListRes, err error)
}
