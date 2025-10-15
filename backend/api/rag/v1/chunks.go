package v1

import (
	"backend/internal/model/entity"

	"github.com/gogf/gf/v2/frame/g"
)

type ChunksListReq struct {
	g.Meta         `path:"/v1/chunksList" method:"get" tags:"rag" sm:"获取文档片段列表"`
	KnowledgeDocId int64 `p:"knowledge_doc_id" dc:"knowledge_doc_id" v:"required"`
	Page           int   `p:"page" dc:"page" v:"required|min:1" d:"1"`
	Size           int   `p:"size" dc:"size" v:"required|min:1|max:100" d:"10"`
}

type ChunksListRes struct {
	g.Meta `mime:"application/json"`
	Data   []*entity.KnowledgeChunks `json:"data"`
	Total  int                       `json:"total"`
	Page   int                       `json:"page"`
	Size   int                       `json:"size"`
}

type ChunkDeleteReq struct {
	g.Meta `path:"/v1/chunksDelete" method:"delete" tags:"rag" sm:"删除文档片段"`
	Id     int64 `p:"id" dc:"id" v:"required"`
}

type ChunkDeleteRes struct {
	g.Meta `mime:"application/json"`
}

type UpdateChunkReq struct {
	g.Meta `path:"/v1/chunksPut" method:"put" tags:"rag" sm:"更新文档片段状态"`
	Ids    []int64 `p:"ids" dc:"ids" v:"required"`
	Status int     `p:"status" dc:"status" v:"required|in:0,1"`
}

type UpdateChunkRes struct {
	g.Meta `mime:"application/json"`
}

type UpdateChunkContentReq struct {
	g.Meta  `path:"/v1/chunks_content" method:"put" tags:"rag" sm:"更新文档片段内容"`
	Id      int64  `p:"id" dc:"id" v:"required"`
	Content string `p:"content" dc:"content" v:"required"`
}

type UpdateChunkContentRes struct {
	g.Meta `mime:"application/json"`
}
