package ai_chat

import (
	"context"
	"log"

	"github.com/VH992098059/chat-history/eino"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
)

type ChatBase struct {
	cm model.BaseChatModel
	eh *eino.History
}

var chat *ChatBase

func GetChat() *ChatBase {
	return chat
}

func (c *ChatBase) GetAnswerStream(ctx context.Context, id string, question string) (answer *schema.StreamReader[*schema.Message], err error) {
	message, err := c.docsMessage(ctx, id, question)
	if err != nil {
		return
	}
	ctx = context.Background()
	log.Println(message)
	return
}
