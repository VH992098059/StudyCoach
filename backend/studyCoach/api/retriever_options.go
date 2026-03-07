package api

import (
	"backend/studyCoach/common"
	"fmt"
	"strings"

	"github.com/cloudwego/eino-ext/components/retriever/es8"
	milvus2 "github.com/cloudwego/eino-ext/components/retriever/milvus2"
	er "github.com/cloudwego/eino/components/retriever"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
	"github.com/qdrant/go-client/qdrant"
)

// buildRetrieverFilterOptions 根据向量引擎类型构建检索过滤选项。
// 返回 TopK + 引擎专属 filter 的 retriever.Option 列表。
func buildRetrieverFilterOptions(conf *common.Config, knowledgeName string, excludeIDs []string, topK int) ([]er.Option, error) {
	opts := []er.Option{er.WithTopK(topK)}

	if conf.UseES() {
		esQuery := buildESFilterQuery(knowledgeName, excludeIDs)
		opts = append(opts, es8.WithFilters(esQuery))
		return opts, nil
	}
	if conf.UseQdrant() {
		qdrantFilter := buildQdrantFilter(knowledgeName, excludeIDs)
		opts = append(opts, er.WithDSLInfo(map[string]any{"filter": qdrantFilter}))
		return opts, nil
	}
	if conf.UseMilvus() {
		milvusExpr := buildMilvusFilterExpr(knowledgeName, excludeIDs)
		if milvusExpr != "" {
			opts = append(opts, milvus2.WithFilter(milvusExpr))
		}
		return opts, nil
	}

	return nil, fmt.Errorf("no valid vector engine configuration")
}

// buildMilvusFilterExpr 构建 Milvus 布尔过滤表达式。
// eino-ext milvus2 将 MetaData 存入 metadata JSON 字段，主键为 id。
// 语法参考 https://milvus.io/docs/boolean.md
func buildMilvusFilterExpr(knowledgeName string, excludeIDs []string) string {
	escape := func(s string) string {
		return `"` + strings.ReplaceAll(s, `"`, `\"`) + `"`
	}
	// metadata["_knowledge_name"] 匹配知识库
	parts := []string{fmt.Sprintf(`metadata["%s"] == %s`, common.KnowledgeName, escape(knowledgeName))}
	if len(excludeIDs) > 0 {
		quoted := make([]string, len(excludeIDs))
		for i, id := range excludeIDs {
			quoted[i] = escape(id)
		}
		parts = append(parts, fmt.Sprintf("id not in [%s]", strings.Join(quoted, ", ")))
	}
	return strings.Join(parts, " && ")
}

// buildESFilterQuery 构建 ES bool query：knowledge_name 匹配 + 排除指定 _id。
func buildESFilterQuery(knowledgeName string, excludeIDs []string) []types.Query {
	q := types.Query{
		Bool: &types.BoolQuery{
			Must: []types.Query{{Match: map[string]types.MatchQuery{common.KnowledgeName: {Query: knowledgeName}}}},
		},
	}
	if len(excludeIDs) > 0 {
		q.Bool.MustNot = []types.Query{
			{Terms: &types.TermsQuery{TermsQuery: map[string]types.TermsQueryField{"_id": excludeIDs}}},
		}
	}
	return []types.Query{q}
}

// buildQdrantFilter 构建 Qdrant Filter：knowledge_name 匹配 + 排除指定 ID。
func buildQdrantFilter(knowledgeName string, excludeIDs []string) *qdrant.Filter {
	f := &qdrant.Filter{
		Must: []*qdrant.Condition{
			{
				ConditionOneOf: &qdrant.Condition_Field{
					Field: &qdrant.FieldCondition{
						Key: common.KnowledgeName,
						Match: &qdrant.Match{
							MatchValue: &qdrant.Match_Keyword{Keyword: knowledgeName},
						},
					},
				},
			},
		},
	}
	if len(excludeIDs) > 0 {
		ids := make([]*qdrant.PointId, len(excludeIDs))
		for i, id := range excludeIDs {
			ids[i] = &qdrant.PointId{PointIdOptions: &qdrant.PointId_Uuid{Uuid: id}}
		}
		f.MustNot = []*qdrant.Condition{
			{ConditionOneOf: &qdrant.Condition_HasId{HasId: &qdrant.HasIdCondition{HasId: ids}}},
		}
	}
	return f
}
