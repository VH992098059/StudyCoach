package rag

import (
	"backend/studyCoach/api"
	"backend/studyCoach/common"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gctx"
)

var ragSvr = &api.Rag{}

func init() {
	ctx := gctx.New()
	conf, err := common.BuildVectorConfig(ctx)
	if err != nil {
		g.Log().Errorf(ctx, "BuildVectorConfig failed: %v", err)
		return
	}
	ragSvr, err = api.NewRagChat(ctx, conf)
	if err != nil {
		g.Log().Errorf(ctx, "New of rag failed: %v", err)
		return
	}
}

func GetRagSvr() *api.Rag {
	return ragSvr
}
