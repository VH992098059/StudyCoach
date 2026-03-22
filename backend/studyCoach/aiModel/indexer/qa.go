package indexer

import (
	"backend/studyCoach/aiModel/CoachChat"
	"backend/studyCoach/common"
	"context"
	"fmt"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
)

// qaGenerateTimeout LLM 生成 QA 的单片超时；可通过环境变量 QA_GENERATE_TIMEOUT_SEC 覆盖（秒）。
func qaGenerateTimeout() time.Duration {
	const defaultSec = 90
	if s := os.Getenv("QA_GENERATE_TIMEOUT_SEC"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 && n <= 600 {
			return time.Duration(n) * time.Second
		}
	}
	return defaultSec * time.Second
}

func qa(ctx context.Context, docs []*schema.Document) (output []*schema.Document, err error) {
	var knowledgeName string
	if value, ok := ctx.Value(common.KnowledgeName).(string); ok {
		knowledgeName = value
	} else {
		return nil, fmt.Errorf("必须提供知识库名称")
	}
	sem := make(chan struct{}, 6)
	var wg sync.WaitGroup
	for _, doc := range docs {
		if doc.MetaData == nil {
			doc.MetaData = map[string]any{}
		}
		wg.Add(1)
		sem <- struct{}{}
		go func(doc *schema.Document) {
			defer wg.Done()
			defer func() { <-sem }()
			qaContent, e := getQAContentWithTime(ctx, doc, knowledgeName, qaGenerateTimeout())
			if e != nil {
				g.Log().Errorf(ctx, "getQAContent failed, err=%v（已用正文摘要降级写入 qa_content，避免索引断言失败）", e)
				// 异步索引 ES 要求 qa_content 为 string；失败时不能留 nil，否则 bulkAdd 报 assert value as string failed
				doc.MetaData[common.FieldQAContent] = qaFallbackContent(doc)
				return
			}
			doc.MetaData[common.FieldQAContent] = qaContent
		}(doc)
	}
	wg.Wait()
	return docs, nil
}

func getQAContent(ctx context.Context, doc *schema.Document, knowledgeName string) (qaContent string, err error) {
	// 已经有数据了就不要再生成了
	if s, ok := doc.MetaData[common.FieldQAContent].(string); ok && len(s) > 0 {
		return s, nil
	}
	cm, err := CoachChat.QaModel(ctx)
	if err != nil {
		return
	}
	generate, err := cm.Generate(ctx, []*schema.Message{
		{
			Role: schema.System,
			Content: fmt.Sprintf("你是一个专业的问题生成助手，任务是从给定的文本中提取或生成可能的问题。你不需要回答这些问题，只需生成问题本身。\n"+
				"知识库名字是：《%s》\n\n"+
				"输出格式：\n"+
				"- 每个问题占一行\n"+
				"- 问题必须以问号结尾\n"+
				"- 避免重复或语义相似的问题\n\n"+
				"生成规则：\n"+
				"- 生成的问题必须严格基于文本内容，不能脱离文本虚构。\n"+
				"- 优先生成事实性问题（如谁、何时、何地、如何）。\n"+
				"- 对于复杂文本，可生成多层次问题（基础事实 + 推理问题）。\n"+
				"- 禁止生成主观或开放式问题（如“你认为...？”）。"+
				"- 数量控制在3-5个", knowledgeName),
		},
		{
			Role:    schema.User,
			Content: doc.Content,
		},
	})
	if err != nil {
		return
	}
	qaContent = generate.Content
	return
}
func getQAContentWithTime(ctx context.Context, doc *schema.Document, knowledgeName string, timeout time.Duration) (qaContent string, err error) {
	if s, ok := doc.MetaData[common.FieldQAContent].(string); ok && len(s) > 0 {
		return s, nil
	}
	cm, err := CoachChat.QaModel(ctx)
	if err != nil {
		return
	}
	ctx2, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	content := clipContent(doc.Content, 5000)
	generate, err := cm.Generate(ctx2, []*schema.Message{
		{
			Role: schema.System,
			Content: fmt.Sprintf("你是一个专业的问题生成助手，任务是从给定的文本中提取或生成可能的问题。你不需要回答这些问题，只需生成问题本身。\n"+
				"知识库名字是：《%s》\n\n"+
				"输出格式：\n"+
				"- 每个问题占一行\n"+
				"- 问题必须以问号结尾\n"+
				"- 避免重复或语义相似的问题\n\n"+
				"生成规则：\n"+
				"- 生成的问题必须严格基于文本内容，不能脱离文本虚构。\n"+
				"- 优先生成事实性问题（如谁、何时、何地、如何）。\n"+
				"- 对于复杂文本，可生成多层次问题（基础事实 + 推理问题）。\n"+
				"- 禁止生成主观或开放式问题（如“你认为...？”）。"+
				"- 数量控制在3-5个", knowledgeName),
		},
		{Role: schema.User, Content: content},
	})
	if err != nil {
		return
	}
	qaContent = generate.Content
	return
}

// QA 之前裁剪超长内容，降低模型侧超限风险
func clipContent(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max])
}

// qaFallbackContent LLM 失败时写入 qa_content 的降级文本（非空 string，供 Embedding 与 ES 字段断言）
func qaFallbackContent(doc *schema.Document) string {
	s := clipContent(doc.Content, 512)
	if s == "" {
		return " "
	}
	return s
}
