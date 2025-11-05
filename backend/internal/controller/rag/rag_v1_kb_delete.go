package rag

import (
	"backend/internal/dao"
	"backend/internal/logic/knowledge"
	"context"

	"backend/api/rag/v1"

	"github.com/gogf/gf/v2/database/gdb"
)

func (c *ControllerV1) KBDelete(ctx context.Context, req *v1.KBDeleteReq) (res *v1.KBDeleteRes, err error) {
	return &v1.KBDeleteRes{}, dao.KnowledgeBase.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		//先删除里面的文档和文档分块
		err = knowledge.DeleteDocumentByKB(ctx, req.Id)
		if err != nil {
			return err
		}
		//再删除知识库
		_, err = dao.KnowledgeBase.Ctx(ctx).TX(tx).WherePri(req.Id).Delete()
		if err != nil {
			return err
		}
		return nil
	})

}
