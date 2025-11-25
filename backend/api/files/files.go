// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package files

import (
	"context"

	"backend/api/files/v1"
)

type IFilesV1 interface {
	FilesGetAll(ctx context.Context, req *v1.FilesGetAllReq) (res *v1.FilesGetAllRes, err error)
	FileUpdate(ctx context.Context, req *v1.FileUpdateReq) (res *v1.FileUpdateRes, err error)
	FileOnDelete(ctx context.Context, req *v1.FileOnDeleteReq) (res *v1.FileOnDeleteRes, err error)
	FileOnInsert(ctx context.Context, req *v1.FileOnInsertReq) (res *v1.FileOnInsertRes, err error)
}
