package temp

import (
	"context"

	"github.com/cloudwego/eino/compose"
)

func BuildstudyCoachFor(ctx context.Context) (r compose.Runnable[any, any], err error) {
	const (
		AnalysisChatTemplate          = "AnalysisChatTemplate"
		AnalysisChatModel             = "AnalysisChatModel"
		studyLambda                   = "studyLambda"
		ResourceTidyLambda            = "ResourceTidyLambda"
		ResourceToolsNode             = "ResourceToolsNode"
		ReActLambda                   = "ReActLambda"
		EmotionAndCompanionShipLambda = "EmotionAndCompanionShipLambda"
		CustomDocumentTransformer9    = "CustomDocumentTransformer9"
		Indexer1                      = "Indexer1"
		OutputResourceTidyLambda      = "OutputResourceTidyLambda"
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
	)
	g := compose.NewGraph[any, any]()
	analysisChatTemplateKeyOfChatTemplate, err := newChatTemplate(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(AnalysisChatTemplate, analysisChatTemplateKeyOfChatTemplate)
	analysisChatModelKeyOfChatModel, err := newChatModel(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(AnalysisChatModel, analysisChatModelKeyOfChatModel)
	_ = g.AddLambdaNode(studyLambda, compose.InvokableLambdaWithOption(newLambda))
	_ = g.AddLambdaNode(ResourceTidyLambda, compose.InvokableLambdaWithOption(newLambda1))
	resourceToolsNodeKeyOfToolsNode, err := newToolsNode(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddToolsNode(ResourceToolsNode, resourceToolsNodeKeyOfToolsNode)
	reActLambdaKeyOfLambda, err := newLambda2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(ReActLambda, reActLambdaKeyOfLambda)
	_ = g.AddLambdaNode(EmotionAndCompanionShipLambda, compose.InvokableLambdaWithOption(newLambda3))
	customDocumentTransformer9KeyOfDocumentTransformer, err := newDocumentTransformer(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddDocumentTransformerNode(CustomDocumentTransformer9, customDocumentTransformer9KeyOfDocumentTransformer)
	indexer1KeyOfIndexer, err := newIndexer(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddIndexerNode(Indexer1, indexer1KeyOfIndexer)
	_ = g.AddLambdaNode(OutputResourceTidyLambda, compose.InvokableLambda(newLambda4))
	studyRetrieverKeyOfRetriever, err := newRetriever(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddRetrieverNode(StudyRetriever, studyRetrieverKeyOfRetriever)
	documentTransformer2KeyOfDocumentTransformer, err := newDocumentTransformer1(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddDocumentTransformerNode(DocumentTransformer2, documentTransformer2KeyOfDocumentTransformer)
	_ = g.AddLambdaNode(EsToReActLambda, compose.InvokableLambdaWithOption(newLambda5))
	_ = g.AddLambdaNode(ChatLambda, compose.InvokableLambdaWithOption(newLambda6))
	taskChatTemplateKeyOfChatTemplate, err := newChatTemplate1(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatTemplateNode(TaskChatTemplate, taskChatTemplateKeyOfChatTemplate)
	_ = g.AddLambdaNode(NoEsLambda, compose.InvokableLambdaWithOption(newLambda7))
	_ = g.AddLambdaNode(ToStudyLambda, compose.InvokableLambdaWithOption(newLambda8))
	toStudyChatModelKeyOfChatModel, err := newChatModel2(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(ToStudyChatModel, toStudyChatModelKeyOfChatModel)
	_ = g.AddLambdaNode(NormalLambda, compose.InvokableLambdaWithOption(newLambda9))
	normalChatModelKeyOfChatModel, err := newChatModel3(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(NormalChatModel, normalChatModelKeyOfChatModel)
	emotionAndCompanionChatModelKeyOfChatModel, err := newChatModel4(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddChatModelNode(EmotionAndCompanionChatModel, emotionAndCompanionChatModelKeyOfChatModel)
	_ = g.AddEdge(compose.START, AnalysisChatTemplate)
	_ = g.AddEdge(ToStudyChatModel, compose.END)
	_ = g.AddEdge(NormalChatModel, compose.END)
	_ = g.AddEdge(EmotionAndCompanionChatModel, compose.END)
	_ = g.AddEdge(ReActLambda, compose.END)
	_ = g.AddEdge(OutputResourceTidyLambda, compose.END)
	_ = g.AddEdge(AnalysisChatTemplate, AnalysisChatModel)
	_ = g.AddEdge(TaskChatTemplate, studyLambda)
	_ = g.AddEdge(ResourceToolsNode, ResourceTidyLambda)
	_ = g.AddEdge(ResourceTidyLambda, CustomDocumentTransformer9)
	_ = g.AddEdge(EsToReActLambda, ReActLambda)
	_ = g.AddEdge(NoEsLambda, ReActLambda)
	_ = g.AddEdge(EmotionAndCompanionShipLambda, EmotionAndCompanionChatModel)
	_ = g.AddEdge(CustomDocumentTransformer9, Indexer1)
	_ = g.AddEdge(Indexer1, OutputResourceTidyLambda)
	_ = g.AddEdge(StudyRetriever, DocumentTransformer2)
	_ = g.AddEdge(DocumentTransformer2, EsToReActLambda)
	_ = g.AddEdge(ChatLambda, TaskChatTemplate)
	_ = g.AddEdge(ToStudyLambda, ToStudyChatModel)
	_ = g.AddEdge(NormalLambda, NormalChatModel)
	_ = g.AddBranch(AnalysisChatModel, compose.NewGraphBranch(newBranch, map[string]bool{ResourceToolsNode: true, EmotionAndCompanionShipLambda: true, ChatLambda: true, ToStudyLambda: true, NormalLambda: true}))
	_ = g.AddBranch(studyLambda, compose.NewGraphBranch(newBranch1, map[string]bool{StudyRetriever: true, NoEsLambda: true}))
	r, err = g.Compile(ctx, compose.WithGraphName("studyCoachFor"))
	if err != nil {
		return nil, err
	}
	return r, err
}
