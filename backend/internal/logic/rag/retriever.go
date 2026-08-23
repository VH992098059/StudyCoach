package rag

import (
	"backend/studyCoach/api"
	"backend/studyCoach/common"
	"sync"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
)

var (
	ragOnce sync.Once
	ragSvr  *api.Rag
)

// GetRagSvr 惰性初始化并返回 RAG 服务实例；初始化失败返回 nil（由调用方判空）。
// 原 init() 在包加载期即构建，且默认值 &api.Rag{} 恒非 nil 导致调用方判空失效、失败时后续空指针；
// 改为首次使用时构建，失败返回 nil，调用方判空真正生效。
func GetRagSvr() *api.Rag {
	ragOnce.Do(func() {
		ctx := gctx.New()
		conf, err := common.BuildVectorConfig(ctx)
		if err != nil {
			g.Log().Errorf(ctx, "BuildVectorConfig failed: %v", err)
			return
		}
		ragSvr, err = api.NewRagChat(ctx, conf)
		if err != nil {
			g.Log().Errorf(ctx, "New of rag failed: %v", err)
		}
	})
	return ragSvr
}
