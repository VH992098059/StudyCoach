package api

import (
	"backend/studyCoach/aiModel/RegularUpdate"
	"backend/studyCoach/common"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/robfig/cron/v3"
)

func RegularTime(ctx context.Context, input string, cronTime string) {
	c := cron.New()
	c.AddFunc(cronTime, func() {
		regularUpdateModel(ctx, input)
	})
	c.Start()
}
func regularUpdateModel(ctx context.Context, input string) (*schema.Message, error) {
	log.Printf("[RegularUpdateModel] 开始处理请求")
	var sources []string
	log.Println("用户内容：", input)
	searchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
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
		output := common.CronTemplate
		output["question"] = sources // 保持兼容性
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
