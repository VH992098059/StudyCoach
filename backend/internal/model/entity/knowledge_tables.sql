-- 知识库主表
CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(100),
    status INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    knowledge_base_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    status INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 知识库文档分块表
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id BIGSERIAL PRIMARY KEY,
    knowledge_doc_id BIGINT NOT NULL REFERENCES knowledge_documents(id),
    chunk_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    ext TEXT,
    status INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
-- 知识库主表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_base_name ON knowledge_base(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);

-- 知识库文档表索引
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_id ON knowledge_chunks(knowledge_doc_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_chunk_id ON knowledge_chunks(chunk_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_base_name ON knowledge_documents(knowledge_base_name);

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 knowledge_base 表创建更新时间触发器
CREATE TRIGGER update_knowledge_base_updated_at 
    BEFORE UPDATE ON knowledge_base 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为 knowledge_documents 表创建更新时间触发器
CREATE TRIGGER update_knowledge_documents_updated_at 
    BEFORE UPDATE ON knowledge_documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为 knowledge_chunks 表创建更新时间触发器
CREATE TRIGGER update_knowledge_chunks_updated_at 
    BEFORE UPDATE ON knowledge_chunks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE knowledge_base IS '知识库主表';
COMMENT ON COLUMN knowledge_base.id IS '知识库ID，主键';
COMMENT ON COLUMN knowledge_base.name IS '知识库名称';
COMMENT ON COLUMN knowledge_base.description IS '知识库描述';
COMMENT ON COLUMN knowledge_base.category IS '知识库分类';
COMMENT ON COLUMN knowledge_base.status IS '状态：1-启用，2-禁用';
COMMENT ON COLUMN knowledge_base.created_at IS '创建时间';
COMMENT ON COLUMN knowledge_base.updated_at IS '更新时间';