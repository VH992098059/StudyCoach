package common

const (
	FieldContent         = "content"
	FieldContentVector   = "content_vector"
	FieldQAContent       = "qa_content"
	FieldQAContentVector = "qa_content_vector"
	FieldExtra           = "ext"
	KnowledgeName        = "_knowledge_name"
	DocExtra             = "location"
	RetrieverFieldKey    = "_retriever_field"

	Title1 = "h1"
	Title2 = "h2"
	Title3 = "h3"
	//新增图片向量
	ImageURL      = "image_url"      //minio图片URL
	ImageVector   = "image_vector"   //图片向量
	ImageFeatures = "image_features" //图片特征描述

)

var (
	// ExtKeys ext 里面需要存储的数据
	ExtKeys = []string{"_extension", "_file_name", "_source", Title1, Title2, Title3}
)
