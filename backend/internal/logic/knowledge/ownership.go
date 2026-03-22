package knowledge

import (
	"backend/internal/dao"
	"backend/internal/model/entity"
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
)

// EnsureKnowledgeBaseBelongsToUser 校验知识库名称是否属于当前用户（users.uuid）。
func EnsureKnowledgeBaseBelongsToUser(ctx context.Context, userUUID string, kbName string) error {
	if kbName == "" {
		return gerror.NewCode(gcode.CodeInvalidParameter, "知识库名称不能为空")
	}
	n, err := dao.KnowledgeBase.Ctx(ctx).
		Where(dao.KnowledgeBase.Columns().Name, kbName).
		Where(dao.KnowledgeBase.Columns().UserUuid, userUUID).
		Count()
	if err != nil {
		return err
	}
	if n == 0 {
		return gerror.NewCode(gcode.CodeNotAuthorized, "无权访问该知识库或知识库不存在")
	}
	return nil
}

// EnsureDocumentBelongsToUser 根据文档 ID 校验其所属知识库是否属于当前用户。
func EnsureDocumentBelongsToUser(ctx context.Context, userUUID string, documentId int64) error {
	doc, err := GetDocumentById(ctx, documentId)
	if err != nil {
		return err
	}
	return EnsureKnowledgeBaseBelongsToUser(ctx, userUUID, doc.KnowledgeBaseName)
}

// EnsureCronScheduleBelongsToUser 根据定时任务 ID 校验其关联知识库是否属于当前用户。
func EnsureCronScheduleBelongsToUser(ctx context.Context, userUUID string, cronID int64) error {
	var s entity.KnowledgeBaseCronSchedule
	err := dao.KnowledgeBaseCronSchedule.Ctx(ctx).Where("id", cronID).Scan(&s)
	if err != nil {
		return err
	}
	if s.Id == 0 {
		return gerror.NewCode(gcode.CodeNotFound, "定时任务不存在")
	}
	return EnsureKnowledgeBaseBelongsToUser(ctx, userUUID, s.KnowledgeBaseName)
}
