package rag

import (
	"backend/internal/logic/rag"
	"backend/studyCoach/api"
	"context"
	"sort"

	"github.com/cloudwego/eino/schema"
	"github.com/goccy/go-json"
	"github.com/gogf/gf/v2/frame/g"

	"backend/api/rag/v1"
)

func (c *ControllerV1) Retriever(ctx context.Context, req *v1.RetrieverReq) (res *v1.RetrieverRes, err error) {
	ragSvr := rag.GetRagSvr()
	if req.TopK == 0 {
		req.TopK = 5
	}
	if req.Score == 0 {
		req.Score = 0.2
	}
	ragReq := &api.RetrieveReq{
		Query:         req.Question,
		TopK:          req.TopK,
		Score:         req.Score,
		KnowledgeName: req.KnowledgeName,
	}
	g.Log().Infof(ctx, "ragReq: %v", ragReq)
	msg, err := ragSvr.Retriever(ctx, ragReq)
	if err != nil {
		return
	}
	for _, document := range msg {
		if document.MetaData != nil {
			delete(document.MetaData, "_dense_vector")
			m := make(map[string]interface{})
			if err = json.Unmarshal([]byte(document.MetaData["ext"].(string)), &m); err != nil {
				return
			}
			document.MetaData["ext"] = m
		}
	}
	// aiModel 默认是把分高的排在两边
	sort.Slice(msg, func(i, j int) bool {
		return msg[i].Score() > msg[j].Score()
	})
	// 确保空切片被序列化为空数组而不是null
	if msg == nil {
		msg = make([]*schema.Document, 0)
	}
	res = &v1.RetrieverRes{
		Document: msg,
	}
	return
}
