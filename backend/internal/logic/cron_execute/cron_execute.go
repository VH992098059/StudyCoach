package cron_execute

import (
	"backend/internal/dao"
	"backend/internal/model/entity"
	"context"
)

func CronExecuteLogicCreate(ctx context.Context, in *entity.CronExecute) (id int64, err error) {
	save, err := dao.CronExecute.Ctx(ctx).Data(in).Save()
	if err != nil {
		return 0, err
	}
	insertId, err := save.LastInsertId()
	if err != nil {
		return 0, err
	}
	return insertId, nil
}
