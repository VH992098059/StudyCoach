package api

import (
	"backend/internal/controller/ws"
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
	robfigcron "github.com/robfig/cron/v3"
)

// insertCronTaskLog 写入 cron_log（失败不影响主流程）
func insertCronTaskLog(ctx context.Context, task *entity.KnowledgeBaseCronSchedule, level, content string) {
	row := g.Map{
		"cron_id":     task.Id,
		"content":     content,
		"level":       level,
		"create_time": gtime.Now(),
	}
	if _, err := dao.CronLog.Ctx(ctx).Data(row).Insert(); err != nil {
		log.Printf("[Cron] 写入 cron_log 失败: %v", err)
	}
}

// RunRegularUpdateTask 初始化 RAG 并执行定时任务
func RunRegularUpdateTask(ctx context.Context, task *entity.KnowledgeBaseCronSchedule) error {
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
	insertCronTaskLog(ctx, task, "INFO", fmt.Sprintf("开始执行 id=%d name=%s kb=%s", task.Id, task.CronName, task.KnowledgeBaseName))

	// 调用 AI 模型获取更新内容（传入完整 task 和 rag，支持知识库预检索）
	msg, err := regularUpdateModel(ctx, task, rag)
	if err != nil {
		log.Printf("[Cron] 任务 %s AI生成失败: %v", task.CronName, err)
		insertCronTaskLog(ctx, task, "ERROR", fmt.Sprintf("AI 生成失败: %v", err))
		ws.BroadcastCronCompleteGlobal(task.Id, task.CronName, false)
		return err
	}

	// ContentType: 1=全量更新，2=增量
	if task.ContentType == 1 {
		// 全量更新：清除旧数据
		cronID := fmt.Sprintf("%d", task.Id)
		log.Printf("[Cron] 全量更新，正在清理旧数据: CronID=%s", cronID)
		if err := rag.conf.DeleteDocumentsByCronID(ctx, cronID); err != nil {
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
		insertCronTaskLog(ctx, task, "ERROR", fmt.Sprintf("写入知识库/索引失败: %v", err))
		ws.BroadcastCronCompleteGlobal(task.Id, task.CronName, false)
		return err
	}

	// 记录最近执行：cron_name_fk 上有唯一索引 idx_cron_name_execute，同一任务多次执行只能 UPDATE，不能重复 INSERT
	now := time.Now()
	nextRun := nextScheduledRunTime(task.CronExpression, now)
	cronExecCols := dao.CronExecute.Columns()
	res, upErr := dao.CronExecute.Ctx(ctx).
		Where(cronExecCols.CronNameFk, task.CronName).
		Data(do.CronExecute{
			ExecuteTime: gtime.NewFromTime(now),
			NextTime:    gtime.NewFromTime(nextRun),
		}).Update()
	if upErr != nil {
		log.Printf("[Cron] 更新执行记录失败: %v", upErr)
	} else {
		n, _ := res.RowsAffected()
		if n == 0 {
			_, insErr := dao.CronExecute.Ctx(ctx).Data(do.CronExecute{
				CronNameFk:  task.CronName,
				ExecuteTime: gtime.NewFromTime(now),
				NextTime:    gtime.NewFromTime(nextRun),
			}).Insert()
			if insErr != nil {
				log.Printf("[Cron] 记录执行日志失败: %v", insErr)
			}
		}
	}

	insertCronTaskLog(ctx, task, "INFO", fmt.Sprintf("执行完成，已提交索引，知识库=%s，下次计划=%s", task.KnowledgeBaseName, nextRun.Format(time.RFC3339)))
	log.Printf("[Cron] 任务 %s 执行完成", task.CronName)
	ws.BroadcastCronCompleteGlobal(task.Id, task.CronName, true)
	return nil
}

func regularUpdateModel(ctx context.Context, task *entity.KnowledgeBaseCronSchedule, rag *Rag) (*schema.Message, error) {
	log.Printf("[RegularUpdateModel] 开始处理请求")
	input := task.CronName
	var sources []string
	log.Println("用户内容：", input)

	// 1. 从知识库预检索已有内容，让 AI 了解当前知识库状态
	var knowledgeContent string
	if task.KnowledgeBaseName != "" && rag != nil {
		kbCtx, kbCancel := context.WithTimeout(ctx, 60*time.Second)
		kbDocs, kbErr := rag.Retriever(kbCtx, &RetrieveReq{
			Query:         input,
			TopK:          5,
			Score:         1.3,
			KnowledgeName: task.KnowledgeBaseName,
		})
		kbCancel()
		if kbErr != nil {
			log.Printf("[RegularUpdateModel] 知识库检索失败(继续执行): %v", kbErr)
		} else if len(kbDocs) > 0 {
			var kbParts []string
			for i, doc := range kbDocs {
				kbParts = append(kbParts, fmt.Sprintf("[%d] %s", i+1, doc.Content))
			}
			knowledgeContent = fmt.Sprintf(
				"## 以下是知识库「%s」的现有内容，请参考并基于这些内容进行更新和补充：\n\n%s",
				task.KnowledgeBaseName, strings.Join(kbParts, "\n\n"),
			)
			log.Printf("[RegularUpdateModel] 从知识库检索到 %d 条相关内容", len(kbDocs))
		}
	}

	// 2. 外部网络搜索获取最新信息
	searchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	sources = append(sources, SearchConcurrentlyWithCache(searchCtx, input)...)
	sources = append(sources, input)

	cfg := g.Cfg()
	apiKey, err := cfg.Get(ctx, "cron.apiKey")
	if err != nil || apiKey.String() == "" {
		return nil, fmt.Errorf("config missing: cron.apiKey")
	}
	baseURL, err := cfg.Get(ctx, "cron.baseURL")
	if err != nil || baseURL.String() == "" {
		return nil, fmt.Errorf("config missing: cron.baseURL")
	}
	chatModel, err := cfg.Get(ctx, "cron.model")
	if err != nil || chatModel.String() == "" {
		return nil, fmt.Errorf("config missing: cron.model")
	}
	conf := &common.Config{
		APIKey:    apiKey.String(),
		BaseURL:   baseURL.String(),
		ChatModel: chatModel.String(),
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

		output := make(map[string]any)
		for k, v := range common.CronTemplate {
			output[k] = v
		}

		output["time_now"] = time.Now().Format(time.RFC3339)
		output["question"] = strings.Join(sources, "\n\n")
		output["knowledge"] = knowledgeContent

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

// nextScheduledRunTime 按与调度器一致的 6 域表达式（秒 分 时 日 月 周）计算下一次触发时间；解析失败时退回 now+24h，避免 INSERT 缺少 next_time。
func nextScheduledRunTime(cronExpr string, from time.Time) time.Time {
	expr := strings.TrimSpace(cronExpr)
	if expr == "" {
		return from.Add(24 * time.Hour)
	}
	parser := robfigcron.NewParser(
		robfigcron.Second | robfigcron.Minute | robfigcron.Hour |
			robfigcron.Dom | robfigcron.Month | robfigcron.Dow,
	)
	sched, err := parser.Parse(expr)
	if err != nil {
		log.Printf("[Cron] Cron 表达式解析失败，next_time 使用 +24h: expr=%q err=%v", cronExpr, err)
		return from.Add(24 * time.Hour)
	}
	return sched.Next(from)
}

// ExecutePomodoroReminder 执行番茄钟提醒任务
func ExecutePomodoroReminder(ctx context.Context, task *entity.KnowledgeBaseCronSchedule) error {
	log.Printf("[Pomodoro] 番茄钟提醒触发: %s (ID: %d)", task.CronName, task.Id)
	insertCronTaskLog(ctx, task, "INFO", fmt.Sprintf("番茄钟提醒触发 id=%d", task.Id))

	// 广播 WebSocket 消息给前端
	ws.BroadcastCronCompleteGlobal(task.Id, task.CronName, true)

	// 记录执行时间
	now := time.Now()
	nextRun := nextScheduledRunTime(task.CronExpression, now)
	cronExecCols := dao.CronExecute.Columns()
	res, upErr := dao.CronExecute.Ctx(ctx).
		Where(cronExecCols.CronNameFk, task.CronName).
		Data(do.CronExecute{
			ExecuteTime: gtime.NewFromTime(now),
			NextTime:    gtime.NewFromTime(nextRun),
		}).Update()
	if upErr != nil {
		log.Printf("[Pomodoro] 更新执行记录失败: %v", upErr)
	} else {
		n, _ := res.RowsAffected()
		if n == 0 {
			_, insErr := dao.CronExecute.Ctx(ctx).Data(do.CronExecute{
				CronNameFk:  task.CronName,
				ExecuteTime: gtime.NewFromTime(now),
				NextTime:    gtime.NewFromTime(nextRun),
			}).Insert()
			if insErr != nil {
				log.Printf("[Pomodoro] 记录执行日志失败: %v", insErr)
			}
		}
	}

	insertCronTaskLog(ctx, task, "INFO", fmt.Sprintf("番茄钟提醒完成，下次计划=%s", nextRun.Format(time.RFC3339)))
	return nil
}
