package knowledge

import (
	v1 "backend/api/rag/v1"
	"backend/internal/dao"
	"backend/internal/model/entity"
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/google/uuid"
)

// SaveChunksData 批量保存知识块数据。
// 仅当所有 chunk 均保存失败时才标记文档为 Failed；若有任一成功，保持 Indexing，由后续 QA 回调更新为 Active。
func SaveChunksData(ctx context.Context, documentsId int64, chunks []entity.KnowledgeChunks) error {
	if len(chunks) == 0 {
		return nil
	}
	successCount := 0
	for _, chunk := range chunks {
		if chunk.KnowledgeDocId == 0 {
			chunk.KnowledgeDocId = documentsId
		}
		if chunk.ChunkId == "" {
			chunk.ChunkId = uuid.NewString()
		}
		// 先尝试查询是否存在
		var existing entity.KnowledgeChunks
		err := dao.KnowledgeChunks.Ctx(ctx).Where("chunk_id", chunk.ChunkId).Scan(&existing)

		if err == nil && existing.Id > 0 {
			// 已存在，更新（排除 id 和 created_at）
			_, err = dao.KnowledgeChunks.Ctx(ctx).
				Where("chunk_id", chunk.ChunkId).
				Data(g.Map{
					"knowledge_doc_id": chunk.KnowledgeDocId,
					"content":          chunk.Content,
					"ext":              chunk.Ext,
					"status":           chunk.Status,
				}).
				Update()
			if err != nil {
				g.Log().Errorf(ctx, "SaveChunksData update failed for chunk_id=%s, err=%+v", chunk.ChunkId, err)
			} else {
				successCount++
			}
		} else {
			// 不存在，插入（id 设为 0 让数据库自动分配）
			chunk.Id = 0
			_, err = dao.KnowledgeChunks.Ctx(ctx).Data(chunk).OmitEmpty().Insert()
			if err != nil {
				g.Log().Errorf(ctx, "SaveChunksData insert failed for chunk_id=%s, err=%+v", chunk.ChunkId, err)
			} else {
				successCount++
			}
		}
	}

	// 有切片内容成功落库时保持 Indexing，仅全部失败时才标记 Failed
	status := int(v1.StatusIndexing)
	if successCount == 0 {
		status = int(v1.StatusFailed)
	}
	UpdateDocumentsStatus(ctx, documentsId, status)
	return nil
}

// GetChunksList 查询知识块列表
func GetChunksList(ctx context.Context, where entity.KnowledgeChunks, page, size int) (list []entity.KnowledgeChunks, total int, err error) {
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = defaultPageSize
	}
	if size > maxPageSize {
		size = maxPageSize
	}

	model := dao.KnowledgeChunks.Ctx(ctx)
	if where.KnowledgeDocId != 0 {
		model = model.Where("knowledge_doc_id", where.KnowledgeDocId)
	}
	if where.ChunkId != "" {
		model = model.Where("chunk_id", where.ChunkId)
	}

	total, err = model.Count()
	if err != nil {
		return
	}
	if total == 0 {
		return nil, 0, nil
	}

	err = model.Page(size, page).Order("created_at desc").Scan(&list)
	return
}

// GetChunkById 根据ID查询单个知识块
func GetChunkById(ctx context.Context, id int64) (chunk entity.KnowledgeChunks, err error) {
	err = dao.KnowledgeChunks.Ctx(ctx).Where("id", id).Scan(&chunk)
	return
}

// DeleteChunkById 根据ID软删除知识块
func DeleteChunkById(ctx context.Context, id int64) error {
	_, err := dao.KnowledgeChunks.Ctx(ctx).Where("id", id).Delete()
	return err
}

// UpdateChunkByIds 根据ID更新知识块
func UpdateChunkByIds(ctx context.Context, ids []int64, data entity.KnowledgeChunks) error {
	model := dao.KnowledgeChunks.Ctx(ctx).WhereIn("id", ids)
	if data.Content != "" {
		model = model.Data("content", data.Content)
	}
	if data.Status != 0 {
		model = model.Data("status", data.Status)
	}
	_, err := model.Update()
	return err
}

// GetAllChunksByDocId gets all chunks by document id
func GetAllChunksByDocId(ctx context.Context, docId int64, fields ...string) (list []entity.KnowledgeChunks, err error) {
	model := dao.KnowledgeChunks.Ctx(ctx).Where("knowledge_doc_id", docId)
	if len(fields) > 0 {
		for _, field := range fields {
			model = model.Fields(field)
		}
	}
	err = model.Scan(&list)
	return
}
