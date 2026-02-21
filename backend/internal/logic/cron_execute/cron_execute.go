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

func RuCronExecuteList(ctx context.Context, cronNameFk string, page, pageSize int) (list []entity.CronExecute, total int, err error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	model := dao.CronExecute.Ctx(ctx).Where("cron_name_fk", cronNameFk)

	total, err = model.Count()
	if err != nil {
		return nil, 0, err
	}

	err = model.Page(page, pageSize).OrderDesc("execute_time").Scan(&list)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}
