package ai_chat

import (
	"context"
	"fmt"
	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"
)

func createTemplate() prompt.ChatTemplate {
	return prompt.FromMessages(
		schema.FString,
		schema.SystemMessage("{role}，请严格遵循以下响应准则：\n"+
			"1. 核心依据参考资料，辅以适度外部信息： 所有回答必须优先并主要依据提供的参考资料。在参考资料信息不足或可补充时，允许适量引用外部通用知识以提升答案的全面性、深度和可理解性。外部信息必须与参考资料内容高度相关且贴合问题语境。\n"+
			"2. 直接引用与明确标注： 若参考资料包含对问题的明确解答，请直接引用原文内容作答，并在引用后通过括号标注来源（示例：据文档#X所示）。\n"+
			"3. 逻辑推断与清晰标识： 当参考资料中的信息不完整或表述模糊，需要进行合理推断才能得出结论时，请进行逻辑推断，但必须在推断结论前明确标注“推测结论：”。\n"+
			"4. 资料关联性判断与替代方案： 若当前参考资料与问题无实质关联，无法提供有效信息时，统一回复**“当前资料未包含有效信息，但根据通用知识，可提供以下参考：[此处简洁概述相关外部通用知识，确保其普遍性与准确性]”。\n"+
			"5. 结构化与数据/原文支撑： 采用清晰的结构化表述方式**。论点应优先通过数据或原文引用来支撑。引用的外部通用知识需在表述中明确区分（例如，使用“一般认为”、“普遍存在”等表述，或在句末简单注明“基于通用知识”）。\n"+
			"6. 关键信息溯源与外部信息免责： 关键数据和原文引用需精确标注来源段落编号（示例：据文档#3所示）。引用的外部通用知识无需标注具体来源，但必须确保其准确性和权威性，避免引入错误信息。\n\n"+
			"当前有效参考资料集：\n"+
			"问题类型识别中...响应生成模式已就绪"),
		schema.MessagesPlaceholder("chat_history", true),
		schema.UserMessage(`【问题描述】{question} `),
	)
}

// newChatTemplate component initialization function of node 'CustomChatTemplate18' in graph 'retrieverChat'
func newChatTemplate(template prompt.ChatTemplate, data map[string]any) ([]*schema.Message, error) {
	msg, err := template.Format(context.Background(), data)
	if err != nil {
		return nil, fmt.Errorf("失败：%w", err)
	}
	return msg, nil
}
func (c *ChatBase) docsMessage(ctx context.Context, id string, que string) (messages []*schema.Message, err error) {
	history, err := c.eh.GetHistory(id, 30)
	if err != nil {
		return nil, err
	}
	template := createTemplate()
	data := map[string]any{
		"role":         "你是一个专业的AI助手，能够根据提供的参考信息准确回答用户问题。",
		"question":     que,
		"chat_history": history,
	}

	messages, err = newChatTemplate(template, data)
	if err != nil {
		return nil, err
	}
	return
}
