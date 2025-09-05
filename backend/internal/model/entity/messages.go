// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

// Messages is the golang structure for table messages.
type Messages struct {
	Id             int64  `json:"id"             orm:"id"              description:""` //
	MsgId          string `json:"msgId"          orm:"msg_id"          description:""` //
	ConversationId string `json:"conversationId" orm:"conversation_id" description:""` //
	ParentId       string `json:"parentId"       orm:"parent_id"       description:""` //
	Role           string `json:"role"           orm:"role"            description:""` //
	Content        string `json:"content"        orm:"content"         description:""` //
	CreatedAt      int64  `json:"createdAt"      orm:"created_at"      description:""` //
	OrderSeq       int64  `json:"orderSeq"       orm:"order_seq"       description:""` //
	TokenCount     int64  `json:"tokenCount"     orm:"token_count"     description:""` //
	Status         string `json:"status"         orm:"status"          description:""` //
	Metadata       string `json:"metadata"       orm:"metadata"        description:""` //
	IsContextEdge  bool   `json:"isContextEdge"  orm:"is_context_edge" description:""` //
	IsVariant      bool   `json:"isVariant"      orm:"is_variant"      description:""` //
}
