package ai_chat

import (
	"backend/internal/dao"
	"backend/internal/model/entity"
	"backend/studyCoach/api"
	"backend/studyCoach/common"
	"backend/utility"
	"context"
	"fmt"
	"strings"
	"time"

	v1 "backend/api/ai_chat/v1"

	"github.com/cloudwego/eino/schema"
	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) AiChat(ctx context.Context, req *v1.AiChatReq) (res *v1.AiChatRes, err error) {
	startTime := time.Now()
	defer func() {
		duration := time.Since(startTime)
		g.Log().Infof(ctx, "AiChat 接口总耗时: %v", duration)
	}()

	// ======================================
	// 前置校验：所有校验必须在流式响应前完成，失败直接返回4xx
	// ======================================
	// 1. 参数范围校验
	if req.TopK <= 0 || req.TopK > 20 {
		return nil, gerror.NewCode(gcode.New(400, "参数错误：top_k取值范围为1-20", nil))
	}
	if req.Score < 0 || req.Score > 1 {
		return nil, gerror.NewCode(gcode.New(400, "参数错误：score取值范围为0-1", nil))
	}

	// 2. 知识库权限校验
	if req.KnowledgeName != "" {
		userUUID, err := utility.CurrentUserUUID(ctx)
		if err != nil {
			return nil, gerror.NewCode(gcode.New(401, "用户信息获取失败，请重新登录", nil))
		}
		// 校验用户是否有权限访问该知识库
		var kb entity.KnowledgeBase
		err = dao.KnowledgeBase.Ctx(ctx).
			Where(dao.KnowledgeBase.Columns().Name, req.KnowledgeName).
			Where(dao.KnowledgeBase.Columns().UserUuid, userUUID).
			Scan(&kb)
		if err != nil || kb.Id == 0 {
			return nil, gerror.NewCode(gcode.New(403, "无权访问该知识库或知识库不存在", nil))
		}
		if kb.Status != 1 {
			return nil, gerror.NewCode(gcode.New(400, "知识库已禁用或正在处理中", nil))
		}
	}

	// 3. 上传文件校验（简单校验文件名格式，避免路径遍历）
	for _, fileName := range req.UploadedFiles {
		if strings.Contains(fileName, "..") || strings.Contains(fileName, "/") || strings.Contains(fileName, "\\") {
			return nil, gerror.NewCode(gcode.New(400, "参数错误：文件名包含非法字符", nil))
		}
	}

	// 调试：打印 MultiContent
	multiContent := req.GetMultiContent()
	g.Log().Infof(ctx, "MultiContent 长度: %d", len(multiContent))
	for i, part := range multiContent {
		g.Log().Infof(ctx, "MultiContent[%d]: Type=%s, Text=%s, Base64Data长度=%d",
			i, part.Type, part.Text, len(part.Base64Data))
	}

	var streamReader *schema.StreamReader[*schema.Message]
	var documents []*schema.Document

	fmt.Printf("使用联网状态：%t，知识库使用：%s\n", req.IsNetwork, req.KnowledgeName)
	if req.IsStudyMode != true {
		streamReader, documents, err = api.ChatNormalModel(ctx, req)
	} else {
		streamReader, documents, err = api.ChatAiModel(ctx, req)
	}

	// 业务层调用失败，直接返回错误（此时还没发送任何响应头）
	if err != nil {
		g.Log().Error(ctx, "LLM调用失败：", err)
		// 内部错误脱敏，不返回具体错误信息
		if gerror.Code(err).Code() >= 500 {
			return nil, gerror.NewCode(gcode.New(500, "服务暂时不可用，请稍后重试", nil))
		}
		return nil, err
	}
	defer streamReader.Close()

	// 所有校验通过，进入流式响应
	err = common.StreamResponse(ctx, streamReader, documents)
	if err != nil {
		g.Log().Error(ctx, "流式响应失败：", err)
	}

	return &v1.AiChatRes{}, nil
}
