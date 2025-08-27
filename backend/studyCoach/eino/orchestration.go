package eino

import (
	"backend/studyCoach/configTool"
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func BuildstudyCoachFor(ctx context.Context, conf *configTool.Config) (r compose.Runnable[map[string]any, *schema.Message], err error) {
	const (
		AnalysisChatTemplate          = "AnalysisChatTemplate"
		AnalysisChatModel             = "AnalysisChatModel"
		studyLambda                   = "studyLambda"
		ReActLambda                   = "ReActLambda"
		EmotionAndCompanionShipLambda = "EmotionAndCompanionShipLambda"
		StudyRetriever                = "StudyRetriever"
		DocumentTransformer2          = "DocumentTransformer2"
		EsToReActLambda               = "EsToReActLambda"
		ChatLambda                    = "ChatLambda"
		TaskChatTemplate              = "TaskChatTemplate"
		NoEsLambda                    = "NoEsLambda"
		ToStudyLambda                 = "ToStudyLambda"
		ToStudyChatModel              = "ToStudyChatModel"
		NormalLambda                  = "NormalLambda"
		NormalChatModel               = "NormalChatModel"
		EmotionAndCompanionChatModel  = "EmotionAndCompanionChatModel"
		ToStudyChatTemplate           = "ToStudyChatTemplate"
		NormalChatTemplate            = "NormalChatTemplate"
	)
	g := compose.NewGraph[map[string]any, *schema.Message]()
	analysisChatTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(AnalysisChatTemplate, analysisChatTemplateKeyOfChatTemplate)
	analysisChatModelKeyOfChatModel, err := newChatModel(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(AnalysisChatModel, analysisChatModelKeyOfChatModel)
	_ = g.AddLambdaNode(studyLambda, compose.InvokableLambdaWithOption(newLambda))
	reActLambdaKeyOfLambda, err := newLambda1(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(ReActLambda, reActLambdaKeyOfLambda)
	_ = g.AddLambdaNode(EmotionAndCompanionShipLambda, compose.InvokableLambdaWithOption(newLambda2))
	studyRetrieverKeyOfRetriever, err := newRetriever(ctx, conf)
	if err != nil {
		return nil, err
	}
	_ = g.AddRetrieverNode(StudyRetriever, studyRetrieverKeyOfRetriever)
	documentTransformer2KeyOfDocumentTransformer, err := newDocumentTransformer(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddDocumentTransformerNode(DocumentTransformer2, documentTransformer2KeyOfDocumentTransformer)
	_ = g.AddLambdaNode(EsToReActLambda, compose.InvokableLambdaWithOption(newLambda3))
	_ = g.AddLambdaNode(ChatLambda, compose.InvokableLambdaWithOption(newLambda4))
	taskChatTemplateKeyOfChatTemplate, err := newChatTemplate1(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(TaskChatTemplate, taskChatTemplateKeyOfChatTemplate)
	_ = g.AddLambdaNode(NoEsLambda, compose.InvokableLambdaWithOption(newLambda5))
	_ = g.AddLambdaNode(ToStudyLambda, compose.InvokableLambdaWithOption(newLambda6))
	toStudyChatModelKeyOfChatModel, err := newChatModel2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(ToStudyChatModel, toStudyChatModelKeyOfChatModel)
	_ = g.AddLambdaNode(NormalLambda, compose.InvokableLambdaWithOption(newLambda7))
	normalChatModelKeyOfChatModel, err := newChatModel3(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(NormalChatModel, normalChatModelKeyOfChatModel)
	emotionAndCompanionChatModelKeyOfChatModel, err := NewChatModel4(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(EmotionAndCompanionChatModel, emotionAndCompanionChatModelKeyOfChatModel)
	toStudyChatTemplateKeyOfChatTemplate, err := newChatTemplate2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(ToStudyChatTemplate, toStudyChatTemplateKeyOfChatTemplate)
	normalChatTemplateKeyOfChatTemplate, err := newChatTemplate3(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(NormalChatTemplate, normalChatTemplateKeyOfChatTemplate)
	_ = g.AddEdge(compose.START, AnalysisChatTemplate)
	_ = g.AddEdge(ToStudyChatModel, compose.END)
	_ = g.AddEdge(NormalChatModel, compose.END)
	_ = g.AddEdge(EmotionAndCompanionChatModel, compose.END)
	_ = g.AddEdge(ReActLambda, compose.END)
	_ = g.AddEdge(AnalysisChatTemplate, AnalysisChatModel)
	_ = g.AddEdge(TaskChatTemplate, studyLambda)
	_ = g.AddEdge(EsToReActLambda, ReActLambda)
	_ = g.AddEdge(NoEsLambda, ReActLambda)
	_ = g.AddEdge(EmotionAndCompanionShipLambda, EmotionAndCompanionChatModel)
	_ = g.AddEdge(StudyRetriever, DocumentTransformer2)
	_ = g.AddEdge(DocumentTransformer2, EsToReActLambda)
	_ = g.AddEdge(ChatLambda, TaskChatTemplate)
	_ = g.AddEdge(ToStudyLambda, ToStudyChatTemplate)
	_ = g.AddEdge(ToStudyChatTemplate, ToStudyChatModel)
	_ = g.AddEdge(NormalLambda, NormalChatTemplate)
	_ = g.AddEdge(NormalChatTemplate, NormalChatModel)
	_ = g.AddBranch(AnalysisChatModel, compose.NewGraphBranch(newBranch, map[string]bool{EmotionAndCompanionShipLambda: true, ChatLambda: true, ToStudyLambda: true, NormalLambda: true}))
	_ = g.AddBranch(studyLambda, compose.NewGraphBranch(newBranch1, map[string]bool{StudyRetriever: true, NoEsLambda: true}))
	r, err = g.Compile(ctx, compose.WithGraphName("studyCoachFor"))
	if err != nil {
		return nil, err
	}
	return r, err
}
