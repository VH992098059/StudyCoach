-- AI聊天应用数据库设计
-- 创建时间: 2025
-- 数据库引擎: PostgreSQL 12+

-- 创建主应用数据库
-- 注意：在 PostgreSQL 中，需要先连接到 postgres 数据库执行创建数据库命令
-- CREATE DATABASE ai_chat_app WITH ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8';

-- 注意：chat_history 数据库已存在，无需创建

-- 连接到 ai_chat_app 数据库后执行以下脚本
-- \c ai_chat_app;

-- ====================================
-- 创建枚举类型
-- ====================================
CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'banned');
CREATE TYPE theme_enum AS ENUM ('light', 'dark', 'auto');
CREATE TYPE font_size_enum AS ENUM ('small', 'medium', 'large');

-- ====================================
-- 用户表 (users)
-- 存储用户基本信息和账户状态
-- ====================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    status user_status_enum DEFAULT 'active'
);

-- 添加注释
COMMENT ON TABLE users IS '用户基本信息表';
COMMENT ON COLUMN users.id IS '用户ID，主键';
COMMENT ON COLUMN users.username IS '用户名，唯一标识';
COMMENT ON COLUMN users.email IS '用户邮箱，用于登录和通知';
COMMENT ON COLUMN users.password_hash IS '密码哈希值，使用bcrypt等安全算法';
COMMENT ON COLUMN users.avatar_url IS '用户头像URL地址';
COMMENT ON COLUMN users.created_at IS '账户创建时间';
COMMENT ON COLUMN users.updated_at IS '最后更新时间';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.status IS '账户状态：active-活跃，inactive-未激活，banned-封禁';

-- 创建唯一索引
CREATE UNIQUE INDEX uk_username ON users(username);
CREATE UNIQUE INDEX uk_email ON users(email);
CREATE INDEX idx_status ON users(status);
CREATE INDEX idx_last_login ON users(last_login_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 users 表创建更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 聊天会话表 (chat_sessions)
-- 存储用户的聊天会话信息
-- ====================================
CREATE TABLE chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    conversation_id VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT '新对话',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0 CHECK (message_count >= 0),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 添加注释
COMMENT ON TABLE chat_sessions IS '聊天会话表';
COMMENT ON COLUMN chat_sessions.id IS '会话ID，主键';
COMMENT ON COLUMN chat_sessions.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN chat_sessions.conversation_id IS '对话ID，关联chat_history.messages表的conversation_id';
COMMENT ON COLUMN chat_sessions.title IS '会话标题，默认为"新对话"';
COMMENT ON COLUMN chat_sessions.created_at IS '会话创建时间';
COMMENT ON COLUMN chat_sessions.updated_at IS '会话最后更新时间';
COMMENT ON COLUMN chat_sessions.message_count IS '消息数量，冗余字段便于快速查询';
COMMENT ON COLUMN chat_sessions.is_deleted IS '软删除标记：false-正常，true-已删除';

-- 创建索引
CREATE UNIQUE INDEX uk_conversation_id ON chat_sessions(conversation_id);
CREATE INDEX idx_user_updated ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX idx_user_created ON chat_sessions(user_id, created_at DESC);
CREATE INDEX idx_is_deleted ON chat_sessions(is_deleted);

-- 添加外键约束
ALTER TABLE chat_sessions 
ADD CONSTRAINT fk_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 为 chat_sessions 表创建更新时间触发器
CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 用户设置表 (user_settings)
-- 存储用户的个性化设置
-- ====================================
CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    theme theme_enum DEFAULT 'auto',
    language VARCHAR(10) DEFAULT 'zh-CN',
    notification_enabled BOOLEAN DEFAULT TRUE,
    auto_save_sessions BOOLEAN DEFAULT TRUE,
    max_sessions INTEGER DEFAULT 50 CHECK (max_sessions > 0),
    font_size font_size_enum DEFAULT 'medium',
    settings_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加注释
COMMENT ON TABLE user_settings IS '用户个性化设置表';
COMMENT ON COLUMN user_settings.id IS '设置ID，主键';
COMMENT ON COLUMN user_settings.user_id IS '用户ID，外键关联users表';
COMMENT ON COLUMN user_settings.theme IS '主题设置：light-浅色，dark-深色，auto-跟随系统';
COMMENT ON COLUMN user_settings.language IS '语言设置，如zh-CN, en-US等';
COMMENT ON COLUMN user_settings.notification_enabled IS '通知开关：false-关闭，true-开启';
COMMENT ON COLUMN user_settings.auto_save_sessions IS '自动保存会话：false-关闭，true-开启';
COMMENT ON COLUMN user_settings.max_sessions IS '最大保存会话数量，超出后自动删除最旧的';
COMMENT ON COLUMN user_settings.font_size IS '字体大小：small-小，medium-中，large-大';
COMMENT ON COLUMN user_settings.settings_json IS '其他设置的JSON存储，便于扩展新功能';
COMMENT ON COLUMN user_settings.created_at IS '设置创建时间';
COMMENT ON COLUMN user_settings.updated_at IS '设置最后更新时间';

-- 创建唯一索引
CREATE UNIQUE INDEX uk_user_id ON user_settings(user_id);

-- 添加外键约束
ALTER TABLE user_settings 
ADD CONSTRAINT fk_settings_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 为 user_settings 表创建更新时间触发器
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 创建 JSONB 索引（用于 settings_json 字段的查询优化）
-- ====================================
CREATE INDEX idx_settings_json_gin ON user_settings USING GIN (settings_json);

-- ====================================
-- 初始化数据
-- ====================================

-- 插入测试用户（可选）
-- INSERT INTO users (username, email, password_hash) VALUES 
-- ('admin', 'admin@example.com', '$2b$10$example_hash_here'),
-- ('testuser', 'test@example.com', '$2b$10$example_hash_here');

-- ====================================
-- 性能优化建议
-- ====================================

-- 1. 定期清理软删除的会话数据
-- DELETE FROM chat_sessions WHERE is_deleted = TRUE AND updated_at < NOW() - INTERVAL '30 days';

-- 2. 分析表使用情况，优化索引
-- ANALYZE users;
-- ANALYZE chat_sessions;
-- ANALYZE user_settings;

-- 3. 启用查询统计（需要管理员权限）
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 4. 定期维护
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE chat_sessions;
-- VACUUM ANALYZE user_settings;

-- ====================================
-- 常用查询示例
-- ====================================

-- 查询用户的所有会话（按更新时间倒序）
-- SELECT * FROM chat_sessions 
-- WHERE user_id = $1 AND is_deleted = FALSE 
-- ORDER BY updated_at DESC;

-- 查询用户设置
-- SELECT * FROM user_settings WHERE user_id = $1;

-- 统计用户会话数量
-- SELECT COUNT(*) as session_count FROM chat_sessions 
-- WHERE user_id = $1 AND is_deleted = FALSE;

-- 查询指定会话的所有消息（跨数据库查询）
-- 注意：PostgreSQL 中跨数据库查询需要使用 dblink 扩展或 foreign data wrapper
-- SELECT m.* FROM chat_history.messages m
-- INNER JOIN ai_chat_app.chat_sessions s ON m.conversation_id = s.conversation_id
-- WHERE s.id = $1 AND s.is_deleted = FALSE
-- ORDER BY m.created_at ASC;

-- 查询用户的最新消息（跨数据库查询）
-- SELECT s.title, m.content, m.created_at 
-- FROM ai_chat_app.chat_sessions s
-- INNER JOIN chat_history.messages m ON s.conversation_id = m.conversation_id
-- WHERE s.user_id = $1 AND s.is_deleted = FALSE
-- ORDER BY m.created_at DESC LIMIT 10;

-- ====================================
-- PostgreSQL 特有功能示例
-- ====================================

-- 使用 JSONB 查询设置
-- SELECT * FROM user_settings 
-- WHERE settings_json @> '{"dark_mode": true}';

-- 使用数组聚合查询用户的所有会话标题
-- SELECT user_id, array_agg(title ORDER BY updated_at DESC) as session_titles
-- FROM chat_sessions 
-- WHERE is_deleted = FALSE 
-- GROUP BY user_id;

-- 使用窗口函数查询每个用户的最新会话
-- SELECT DISTINCT ON (user_id) user_id, id, title, updated_at
-- FROM chat_sessions 
-- WHERE is_deleted = FALSE
-- ORDER BY user_id, updated_at DESC;