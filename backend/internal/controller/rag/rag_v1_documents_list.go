package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/model/entity"
	"context"

	"backend/api/rag/v1"
)

func (c *ControllerV1) DocumentsList(ctx context.Context, req *v1.DocumentsListReq) (res *v1.DocumentsListRes, err error) {
	documents, total, err := knowledge.GetDocumentsList(ctx, entity.KnowledgeDocuments{
		KnowledgeBaseName: req.KnowledgeName,
	}, req.Page, req.Size)
	if err != nil {
		return
	}

	res = &v1.DocumentsListRes{
		Data:  documents,
		Total: total,
		Page:  req.Page,
		Size:  req.Size,
	}

	return
}
