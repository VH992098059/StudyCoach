package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/logic/rag"
	"backend/internal/model/entity"
	"backend/studyCoach/api"
	"context"
	"fmt"

	"github.com/gogf/gf/v2/frame/g"

	v1 "backend/api/rag/v1"
)

func (c *ControllerV1) Indexer(ctx context.Context, req *v1.IndexerReq) (res *v1.IndexerRes, err error) {
	svr := rag.GetRagSvr()
	if svr == nil {
		return nil, fmt.Errorf("RAG服务未初始化，请检查Elasticsearch和embedding配置")
	}
	url := req.URL
	var fileName string
	if req.File != nil {
		filename, err := req.File.Save("./uploads/")
		if err != nil {
			return nil, fmt.Errorf("indexer出错：%w", err)
		}
		url = "./uploads/" + filename
		fileName = req.File.Filename
	} else {
		// 如果是URL索引，使用URL作为文件名
		fileName = req.URL
	}
	documents := entity.KnowledgeDocuments{
		KnowledgeBaseName: req.KnowledgeName,
		FileName:          fileName,
		Status:            int(v1.StatusPending),
	}
	documentsId, err := knowledge.SaveDocumentsInfo(ctx, documents)
	if err != nil {
		g.Log().Errorf(ctx, "SaveDocumentsInfo failed, err=%v", err)
		return
	}
	// 开始索引处理，更新状态为索引中
	err = knowledge.UpdateDocumentsStatus(ctx, documentsId, int(v1.StatusIndexing))
	if err != nil {
		g.Log().Errorf(ctx, "UpdateDocumentsStatus to indexing failed, err=%v", err)
	}
	indexReq := &api.IndexReq{
		URI:           url,
		KnowledgeName: req.KnowledgeName,
		DocumentsId:   documentsId,
	}
	ids, err := svr.Index(ctx, indexReq)
	if err != nil {
		return
	}
	res = &v1.IndexerRes{
		DocIDs: ids,
	}
	return
}
