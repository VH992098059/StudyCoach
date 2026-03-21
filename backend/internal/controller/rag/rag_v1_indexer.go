package rag

import (
	"backend/internal/logic/knowledge"
	"backend/internal/logic/rag"
	"backend/internal/model/entity"
	"backend/studyCoach/api"
	"backend/studyCoach/mineruworker"
	"backend/utility"
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/gogf/gf/v2/frame/g"

	v1 "backend/api/rag/v1"
)

func (c *ControllerV1) Indexer(ctx context.Context, req *v1.IndexerReq) (res *v1.IndexerRes, err error) {
	userUUID, err := utility.CurrentUserUUID(ctx)
	if err != nil {
		return nil, err
	}
	if err = knowledge.EnsureKnowledgeBaseBelongsToUser(ctx, userUUID, req.KnowledgeName); err != nil {
		return nil, err
	}
	svr := rag.GetRagSvr()
	if svr == nil {
		return nil, fmt.Errorf("RAG服务未初始化，请检查Elasticsearch和embedding配置")
	}
	url := strings.TrimSpace(req.URL)
	var fileName string
	if req.File != nil {
		uploadDir := utility.FilesUploadsDir(ctx)
		filename, err := req.File.Save(uploadDir)
		if err != nil {
			return nil, fmt.Errorf("indexer出错：%w", err)
		}
		url = filepath.Join(uploadDir, filename)
		fileName = req.File.Filename
	} else {
		// URL 索引：fileName 用于展示与 PDF 判断
		fileName = url
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

	// PDF：MinerU 精准解析为 Markdown 写入 files.root/mineru，再以 .md 走索引流水线（本地 PDF 与 PDF URL 均支持）
	if mineruworker.IsPDFPath(fileName) {
		mdPath, errMu := mineruworker.ExtractPDFToMarkdownFile(ctx, url, documentsId)
		if errMu != nil {
			return nil, errMu
		}
		url = mdPath
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
