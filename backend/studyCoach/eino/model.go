package eino

import (
	"backend/studyCoach/configTool"
	"context"
	"log"
	"os"

	"github.com/cloudwego/eino-ext/components/model/ark"
	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/joho/godotenv"
)

func init() {
	// 尝试从多个可能的路径加载.env文件
	paths := []string{
		".env",                             // 当前目录
		"studyCoach/.env",                  // 从根目录运行时
		"../studyCoach/.env",               // 从backend目录运行时
		"../../studyCoach/studyCoach/.env", // 从更深层目录运行时
	}

	var err error
	for _, path := range paths {
		err = godotenv.Load(path)
		if err == nil {
			log.Printf("成功加载 .env 文件: %s", path)
			break
		}
	}

	if err != nil {
		log.Fatal("加载 .env 文件出错: 尝试了所有可能的路径都失败")
	}
	// 检查环境变量
	if os.Getenv("Model_Type") == "" || os.Getenv("Openai_API_Key") == "" || os.Getenv("Base_URL") == "" {
		log.Fatal(".env 未配置 Model_Type, Openai_API_Key, Base_URL")
	}
}

// newChatModel component initialization function of node 'AnalysisChatModel' in graph 'studyCoachFor'
func newChatModel(ctx context.Context, conf *configTool.Config) (cm model.ToolCallingChatModel, err error) {
	/*config := &ollama.ChatModelConfig{
		// 基础配置
		BaseURL: "http://localhost:11434", // Ollama 服务地址
		Timeout: 300 * time.Second,        // 请求超时时间
		Model:   "hf-mirror.com/MoYoYoTech/VoiceDialogue:Q6_K",
	}*/

	config := &openai.ChatModelConfig{
		Model:   "Qwen/Qwen3-14B",
		APIKey:  conf.ApiKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = openai.NewChatModel(ctx, config)
	log.Println("意图分析模型")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func newChatModel2(ctx context.Context, conf *configTool.Config) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{
		Model:   conf.Model,
		APIKey:  conf.ApiKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = openai.NewChatModel(ctx, config)
	log.Println("ReAct模型分析")
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func BranchNewChatModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{
		Model:   "deepseek-ai/DeepSeek-V3",
		APIKey:  os.Getenv("Openai_API_Key"),
		BaseURL: os.Getenv("Base_URL"),
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel2 component initialization function of node 'ToStudyChatModel' in graph 'studyCoachFor'
func newChatModel3(ctx context.Context, conf *configTool.Config) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &ark.ChatModelConfig{
		Model:   conf.Model,
		APIKey:  conf.ApiKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// newChatModel3 component initialization function of node 'NormalChatModel' in graph 'studyCoachFor'
func newChatModel4(ctx context.Context, conf *configTool.Config) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &openai.ChatModelConfig{
		Model:   conf.Model,
		APIKey:  conf.ApiKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

// NewChatModel4 component initialization function of node 'EmotionAndCompanionChatModel' in graph 'studyCoachFor'
func newChatModel1(ctx context.Context, conf *configTool.Config) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &ark.ChatModelConfig{
		Model:   conf.Model,
		APIKey:  conf.ApiKey,
		BaseURL: conf.BaseURL,
	}
	cm, err = ark.NewChatModel(ctx, config)

	if err != nil {
		return nil, err
	}
	return cm, nil
}

func RewriteModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	config := &ark.ChatModelConfig{
		Model:   g.Cfg().MustGet(ctx, "rewrite.model").String(),
		APIKey:  g.Cfg().MustGet(ctx, "rewrite.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "rewrite.baseURL").String(),
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}

func QaModel(ctx context.Context) (cm model.ToolCallingChatModel, err error) {
	// TODO Modify component configuration here.
	config := &ark.ChatModelConfig{
		Model:   g.Cfg().MustGet(ctx, "qa.model").String(),
		APIKey:  g.Cfg().MustGet(ctx, "qa.apiKey").String(),
		BaseURL: g.Cfg().MustGet(ctx, "qa.baseURL").String(),
	}
	cm, err = ark.NewChatModel(ctx, config)
	if err != nil {
		return nil, err
	}
	return cm, nil
}
