package regular_update

import (
	"backend/internal/logic/regular_update"
	"context"

	"backend/api/regular_update/v1"
)

func (c *ControllerV1) RegularUpdateCreate(ctx context.Context, req *v1.RegularUpdateCreateReq) (res *v1.RegularUpdateCreateRes, err error) {
	id, err := regular_update.RuCreate(ctx, req.KnowledgeBaseId, req.CronExpression)
	if err != nil {
		return nil, err
	}
	return &v1.RegularUpdateCreateRes{
		ID: id,
	}, nil
}
