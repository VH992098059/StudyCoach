package api

import (
	"backend/studyCoach/aiModel/CoachChat"
	"backend/studyCoach/common"
	"backend/studyCoach/rerank"
	"context"
	"sort"
	"sync"
	"time"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

type RetrieveReq struct {
	Query         string   // 检索关键词
	TopK          int      // 检索结果数量
	Score         float64  //  分数阀值(0-2, 0 完全相反，1 毫不相干，2 完全相同,一般需要传入一个大于1的数字，如1.5)
	KnowledgeName string   // 知识库名字
	optQuery      string   // 优化后的检索关键词
	excludeIDs    []string // 要排除的 _id 列表
	rankScore     float64  // 排名分数，原本的score是0-2（实际是1-2），需要在这里改成0-1
}

func (x *RetrieveReq) copy() *RetrieveReq {
	return &RetrieveReq{
		Query:         x.Query,
		TopK:          x.TopK,
		Score:         x.Score,
		KnowledgeName: x.KnowledgeName,
		optQuery:      x.optQuery,
		excludeIDs:    x.excludeIDs,
		rankScore:     x.rankScore,
	}
}

// Retriever 检索
func (x *Rag) Retriever(ctx context.Context, req *RetrieveReq) (msg []*schema.Document, err error) {
	var (
		used        = ""          // 记录已经使用过的关键词
		relatedDocs = &sync.Map{} // 记录相关docs
	)
	req.rankScore = req.Score
	// 大于1的需要-1
	if req.rankScore >= 1 {
		req.rankScore -= 1
	}
	rewriteModel, err := CoachChat.RewriteModel(ctx)
	if err != nil {
		return
	}
	wg := &sync.WaitGroup{}
	var loopErr error
	// 尝试N次重写关键词进行搜索,后续可以考虑做成配置
	for i := 0; i < 3; i++ {
		question := req.Query
		var (
			optMessages    []*schema.Message
			rewriteMessage *schema.Message
		)
		optMessages, err = CoachChat.GetOptimizedQueryMessages(used, question, req.KnowledgeName)
		if err != nil {
			loopErr = err
			break
		}
		// 为rewrite模型调用设置30秒超时
		rewriteCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		rewriteMessage, err = rewriteModel.Generate(rewriteCtx, optMessages)
		cancel()
		if err != nil {
			loopErr = err
			break
		}
		optimizedQuery := rewriteMessage.Content
		used += optimizedQuery + " "
		req.optQuery = optimizedQuery
		wg.Add(1)
		go func(reqCopy *RetrieveReq) {
			defer wg.Done()
			rDocs, retrieveErr := x.retrieveDoOnce(ctx, reqCopy)
			if retrieveErr != nil {
				g.Log().Errorf(ctx, "retrieveDoOnce failed, err=%v", retrieveErr)
				return
			}
			for _, doc := range rDocs {
				if old, e := relatedDocs.LoadOrStore(doc.ID, doc); e {
					// 同文档则保存较高分的结果（对于不同的optQuery，rerank可能会有不同的结果）
					if doc.Score() > old.(*schema.Document).Score() {
						relatedDocs.Store(doc.ID, doc)
					}
				}
			}

		}(req.copy())
	}
	wg.Wait()
	if loopErr != nil {
		err = loopErr
		return
	}
	// 整理需要返回的数据
	relatedDocs.Range(func(key, value any) bool {
		msg = append(msg, value.(*schema.Document))
		return true
	})
	sort.Slice(msg, func(i, j int) bool {
		return msg[i].Score() > msg[j].Score()
	})
	if len(msg) > req.TopK {
		msg = msg[:req.TopK]
	}
	return
}

func (x *Rag) retrieveDoOnce(ctx context.Context, req *RetrieveReq) (relatedDocs []*schema.Document, err error) {
	var (
		docs   []*schema.Document
		qaDocs []*schema.Document
	)
	g.Log().Infof(ctx, "query: %v", req.optQuery)
	// 通过内容检索
	docs, err = x.retrieve(ctx, req, false)
	if err != nil {
		g.Log().Errorf(ctx, "retrieve failed, err=%v", err)
		return
	}
	// 通过qa检索（仅当 qaRtrvr 已初始化；失败不影响主流程）
	if x.qaRtrvr != nil {
		qaDocs, err = x.retrieve(ctx, req, true)
		if err != nil {
			g.Log().Errorf(ctx, "qa retrieve failed, err=%v", err)
		} else {
			docs = append(docs, qaDocs...)
		}
	}
	// 去重
	docs = common.RemoveDuplicates(docs, func(doc *schema.Document) string {
		return doc.ID
	})
	// 重排
	docs, err = rerank.NewRerank(ctx, req.optQuery, docs, req.TopK)
	if err != nil {
		g.Log().Errorf(ctx, "Rerank failed, err=%v", err)
		return
	}
	for _, doc := range docs {
		if doc.Score() < req.rankScore {
			g.Log().Debugf(ctx, "score less: %v, related: %v", doc.Score(), doc.Content)
			continue
		}
		relatedDocs = append(relatedDocs, doc)
	}
	return
}
func (x *Rag) retrieve(ctx context.Context, req *RetrieveReq, qa bool) (msg []*schema.Document, err error) {
	filterOpts, err := buildRetrieverFilterOptions(x.conf, req.KnowledgeName, req.excludeIDs, esTopK)
	if err != nil {
		return nil, err
	}
	// 选择 retriever，若未初始化则直接返回空结果
	var r compose.Runnable[string, []*schema.Document]
	if qa {
		r = x.qaRtrvr
	} else {
		r = x.rtrvr
	}
	if r == nil {
		return nil, nil
	}
	msg, err = r.Invoke(ctx, req.optQuery, compose.WithRetrieverOption(filterOpts...))
	if err != nil {
		return nil, err
	}
	for _, s := range msg {
		if s.Score() > 1 {
			// 本身没意义，最终分数由rerank给，这里只是为了方便测试观察
			s.WithScore(s.Score() - 1)
		}
	}
	return msg, nil
}
