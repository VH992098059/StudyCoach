package regular_update

import (
	"backend/internal/logic/regular_update"
	"context"

	"backend/api/regular_update/v1"
)

func (c *ControllerV1) RegularUpdateDelete(ctx context.Context, req *v1.RegularUpdateDeleteReq) (res *v1.RegularUpdateDeleteRes, err error) {
	ruDelete, err := regular_update.RuDelete(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &v1.RegularUpdateDeleteRes{
		IsOK: ruDelete,
	}, nil
}
