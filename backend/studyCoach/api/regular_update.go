package api

import (
	"backend/internal/dao"
	"backend/internal/model/do"
	"backend/internal/model/entity"
	"backend/studyCoach/aiModel/RegularUpdate"
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// RunRegularUpdateTask 初始化 RAG 并执行定时任务
func RunRegularUpdateTask(ctx context.Context, task *entity.KnowledgeBaseCronSchedule) error {
	// 使用全局 esConf 初始化 Rag
	// esConf 在 openai.go 中定义并初始化
	if esConf == nil {
		return fmt.Errorf("esConf not initialized")
	}

	rag, err := NewRagChat(ctx, esConf)
	if err != nil {
		return fmt.Errorf("failed to init Rag: %v", err)
	}

	// 执行更新逻辑
	return ExecuteRegularUpdate(ctx, task, rag)
}

// ExecuteRegularUpdate 执行定时更新任务
func ExecuteRegularUpdate(ctx context.Context, task *entity.KnowledgeBaseCronSchedule, rag *Rag) error {
	log.Printf("[Cron] 开始执行任务: %s (ID: %d)", task.CronName, task.Id)

	// 调用 AI 模型获取更新内容
	msg, err := regularUpdateModel(ctx, task.CronName)
	if err != nil {
		log.Printf("[Cron] 任务 %s AI生成失败: %v", task.CronName, err)
		return err
	}

	// 处理全量/增量逻辑
	// ContentType: 1=Full, 2=Incremental
	if task.ContentType == 1 {
		// 全量更新：尝试清除旧数据
		// 使用 cron_id 删除该任务产生的所有文档
		cronID := fmt.Sprintf("%d", task.Id)
		log.Printf("[Cron] 全量更新，正在清理旧数据: CronID=%s", cronID)
		if err := common.DeleteDocumentsByCronID(ctx, rag.client, cronID); err != nil {
			log.Printf("[Cron] 清理旧数据失败(可能不存在): %v", err)
			// 继续执行，不因删除失败而终止
		}
	} else {
		log.Printf("[Cron] 增量更新，直接追加内容")
	}

	// 构造新文档并写入知识库
	doc := &schema.Document{
		ID:      fmt.Sprintf("%d-%d", task.Id, time.Now().UnixNano()), // 使用唯一ID防止覆盖历史增量数据(如果是增量) 或 保持唯一性
		Content: msg.Content,
		MetaData: map[string]any{
			"source":           "regular_update",
			common.FieldCronID: fmt.Sprintf("%d", task.Id),
			"created_at":       time.Now(),
		},
	}

	req := &IndexAsyncReq{
		Docs:          []*schema.Document{doc},
		KnowledgeName: task.KnowledgeBaseName,
		DocumentsId:   int64(task.Id),
	}

	// 异步索引
	_, err = rag.IndexAsync(ctx, req)
	if err != nil {
		log.Printf("[Cron] 写入知识库失败: %v", err)
		return err
	}

	// 记录执行历史
	_, err = dao.CronExecute.Ctx(ctx).Data(do.CronExecute{
		CronNameFk:  task.CronName,
		ExecuteTime: gtime.Now(),
	}).Insert()
	if err != nil {
		log.Printf("[Cron] 记录执行日志失败: %v", err)
		// 日志记录失败不视为任务失败
	}

	log.Printf("[Cron] 任务 %s 执行完成", task.CronName)
	return nil
}

func regularUpdateModel(ctx context.Context, input string) (*schema.Message, error) {
	log.Printf("[RegularUpdateModel] 开始处理请求")
	var sources []string
	log.Println("用户内容：", input)
	searchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// 使用 search.go 中定义的 SearchConcurrentlyWithCache
	sources = append(sources, SearchConcurrentlyWithCache(searchCtx, input)...)
	sources = append(sources, input)

	conf := &common.Config{
		APIKey:    g.Cfg().MustGet(ctx, "cron.apiKey").String(),
		BaseURL:   g.Cfg().MustGet(ctx, "cron.baseURL").String(),
		ChatModel: g.Cfg().MustGet(ctx, "cron.model").String(),
		IndexName: "NetworkUpdate",
	}

	maxRetries := 3
	for attempt := 0; attempt < maxRetries; attempt++ {
		model, err := RegularUpdate.BuildRegularUpdate(ctx, conf)
		if err != nil {
			log.Printf("构建模型失败 (尝试 %d/%d): %v", attempt+1, maxRetries, err)
			if attempt == maxRetries {
				return nil, fmt.Errorf("构建模型失败，已重试%d次: %v", maxRetries, err)
			}
			continue
		}

		// 创建一个新的 map，避免并发修改全局变量 common.CronTemplate
		output := make(map[string]any)
		for k, v := range common.CronTemplate {
			output[k] = v
		}

		// 动态设置 time_now
		output["time_now"] = time.Now().Format(time.RFC3339)
		output["question"] = strings.Join(sources, "\n\n") // 将所有内容合并为字符串

		invoke, err := model.Invoke(ctx, output)
		if err != nil {
			select {
			case <-time.After(time.Duration(attempt+1) * time.Second):
			case <-ctx.Done():
				return nil, ctx.Err()
			}
			continue

		}
		log.Printf("生成成功 (尝试 %d/%d)", attempt+1, maxRetries)
		return invoke, nil
	}
	return nil, fmt.Errorf("生成失败，已重试%d次", maxRetries)
}
