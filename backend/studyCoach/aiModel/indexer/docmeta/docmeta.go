// Package docmeta 提供索引文档元数据抽取，供各向量引擎子包与主 indexer 共用。
package docmeta

import (
	"backend/studyCoach/common"

	"github.com/cloudwego/eino/schema"
)

// GetExtData 从文档 MetaData 中按 common.ExtKeys 抽取扩展字段。
func GetExtData(doc *schema.Document) map[string]any {
	if doc.MetaData == nil {
		return nil
	}
	res := make(map[string]any)
	for _, key := range common.ExtKeys {
		if v, e := doc.MetaData[key]; e {
			res[key] = v
		}
	}
	return res
}
