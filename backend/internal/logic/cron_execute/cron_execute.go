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

// RuCronExecuteListByCronId 按任务ID查询执行历史
func RuCronExecuteListByCronId(ctx context.Context, cronId int64, page, pageSize int) (list []entity.CronExecute, total int, err error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	model := dao.CronExecute.Ctx(ctx).Where("cron_id", cronId)

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

// RuCronExecuteDetail 查询执行详情
func RuCronExecuteDetail(ctx context.Context, id int64) (detail *entity.CronExecute, err error) {
	err = dao.CronExecute.Ctx(ctx).Where("id", id).Scan(&detail)
	return detail, err
}

// RuCronExecuteLog 查询执行日志
func RuCronExecuteLog(ctx context.Context, executeId int64, page, pageSize int) (list []entity.CronLog, total int, err error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	model := dao.CronLog.Ctx(ctx).Where("execute_id", executeId)

	total, err = model.Count()
	if err != nil {
		return nil, 0, err
	}

	err = model.Page(page, pageSize).OrderAsc("create_time").Scan(&list)
	if err != nil {
		return nil, 0, err
	}

	return list, total, nil
}
