package indexer

import (
	"context"
	"fmt"
	"github.com/bytedance/sonic"
	"github.com/cloudwego/eino-ext/components/indexer/es8"
	"github.com/cloudwego/eino/components/indexer"
	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
	"studyCoach/studyCoach/common"
	"studyCoach/studyCoach/configTool"
)

// newIndexer component initialization function of node 'IndexerEs' in graph 'indexer'
func newIndexer(ctx context.Context, conf *configTool.Config) (idr indexer.Indexer, err error) {
	// TODO Modify component configuration here.

	config := &es8.IndexerConfig{
		Client:    conf.Client,
		Index:     conf.IndexName,
		BatchSize: 10,
		DocumentToFields: func(ctx context.Context, doc *schema.Document) (field2Value map[string]es8.FieldValue, err error) {
			var knowName string
			if value, ok := ctx.Value(common.KnowledgeName).(string); ok {
				knowName = value
			} else {
				err = fmt.Errorf("需要提供知识库名称")
				return
			}
			doc.ID = uuid.New().String()
			if doc.MetaData != nil {
				marshal, _ := sonic.Marshal(doc.MetaData)
				doc.MetaData[common.DocExtra] = string(marshal)
			}
			return map[string]es8.FieldValue{
				common.FieldContent: {
					Value:    getMdContentWithTitle(doc),
					EmbedKey: common.FieldContentVector, // vectorize doc content and save vector to field "content_vector"
				},
				common.FieldExtra: {
					Value: doc.MetaData[common.DocExtra],
				},
				common.KnowledgeName: {
					Value: knowName,
				},
			}, nil
		},
	}
	embeddingIns11, err := NewEmbedding(ctx, conf)
	if err != nil {
		return nil, err
	}
	config.Embedding = embeddingIns11
	idr, err = es8.NewIndexer(ctx, config)
	if err != nil {
		return nil, err
	}

	return idr, nil
}
func getMdContentWithTitle(doc *schema.Document) string {
	if doc.MetaData == nil {
		return doc.Content
	}
	title := ""
	list := []string{"h1", "h2", "h3", "h4", "h5", "h6"}
	for _, v := range list {
		if d, e := doc.MetaData[v].(string); e && len(d) > 0 {
			title += fmt.Sprintf("%s:%s ", v, d)
		}
	}
	if len(title) == 0 {
		return doc.Content
	}
	return title + "\n" + doc.Content
}
