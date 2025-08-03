-- AI聊天应用数据库设计
-- 创建时间: 2025
-- 数据库引擎: MySQL 8.0+

-- 创建主应用数据库
CREATE DATABASE IF NOT EXISTS ai_chat_app 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 注意：chat_history 数据库已存在，无需创建

USE ai_chat_app;

-- ====================================
-- 用户表 (users)
-- 存储用户基本信息和账户状态
-- ====================================
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',
    username VARCHAR(50) NOT NULL COMMENT '用户名，唯一标识',
    email VARCHAR(100) NOT NULL COMMENT '用户邮箱，用于登录和通知',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希值，使用bcrypt等安全算法',
    avatar_url VARCHAR(500) NULL COMMENT '用户头像URL地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '账户创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账户状态：active-活跃，inactive-未激活，banned-封禁',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username) COMMENT '用户名唯一索引',
    UNIQUE KEY uk_email (email) COMMENT '邮箱唯一索引',
    KEY idx_status (status) COMMENT '状态索引，便于查询活跃用户',
    KEY idx_last_login (last_login_at) COMMENT '最后登录时间索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基本信息表';

-- ====================================
-- 聊天会话表 (chat_sessions)
-- 存储用户的聊天会话信息
-- ====================================
CREATE TABLE chat_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '会话ID，主键',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID，外键关联users表',
    conversation_id VARCHAR(64) NOT NULL COMMENT '对话ID，关联chat_history.messages表的conversation_id',
    title VARCHAR(200) NOT NULL DEFAULT '新对话' COMMENT '会话标题，默认为"新对话"',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '会话创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '会话最后更新时间',
    message_count INT UNSIGNED DEFAULT 0 COMMENT '消息数量，冗余字段便于快速查询',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '软删除标记：0-正常，1-已删除',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_conversation_id (conversation_id) COMMENT '对话ID唯一索引',
    KEY idx_user_updated (user_id, updated_at DESC) COMMENT '用户会话按更新时间排序的复合索引',
    KEY idx_user_created (user_id, created_at DESC) COMMENT '用户会话按创建时间排序的复合索引',
    KEY idx_is_deleted (is_deleted) COMMENT '删除状态索引',
    
    CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天会话表';

-- ====================================
-- 用户设置表 (user_settings)
-- 存储用户的个性化设置
-- ====================================
CREATE TABLE user_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设置ID，主键',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID，外键关联users表',
    theme ENUM('light', 'dark', 'auto') DEFAULT 'auto' COMMENT '主题设置：light-浅色，dark-深色，auto-跟随系统',
    language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言设置，如zh-CN, en-US等',
    notification_enabled TINYINT(1) DEFAULT 1 COMMENT '通知开关：0-关闭，1-开启',
    auto_save_sessions TINYINT(1) DEFAULT 1 COMMENT '自动保存会话：0-关闭，1-开启',
    max_sessions INT UNSIGNED DEFAULT 50 COMMENT '最大保存会话数量，超出后自动删除最旧的',
    font_size ENUM('small', 'medium', 'large') DEFAULT 'medium' COMMENT '字体大小：small-小，medium-中，large-大',
    settings_json JSON NULL COMMENT '其他设置的JSON存储，便于扩展新功能',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '设置创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '设置最后更新时间',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id) COMMENT '每个用户只能有一条设置记录',
    
    CONSTRAINT fk_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户个性化设置表';

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
-- DELETE FROM chat_sessions WHERE is_deleted = 1 AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 2. 分析表使用情况，优化索引
-- ANALYZE TABLE users, chat_sessions, user_settings;

-- 3. 监控慢查询日志
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 2;

-- ====================================
-- 常用查询示例
-- ====================================

-- 查询用户的所有会话（按更新时间倒序）
-- SELECT * FROM chat_sessions 
-- WHERE user_id = ? AND is_deleted = 0 
-- ORDER BY updated_at DESC;

-- 查询用户设置
-- SELECT * FROM user_settings WHERE user_id = ?;

-- 统计用户会话数量
-- SELECT COUNT(*) as session_count FROM chat_sessions 
-- WHERE user_id = ? AND is_deleted = 0;

-- 查询指定会话的所有消息（跨数据库查询）
-- SELECT m.* FROM chat_history.messages m
-- INNER JOIN ai_chat_app.chat_sessions s ON m.conversation_id = s.conversation_id
-- WHERE s.id = ? AND s.is_deleted = 0
-- ORDER BY m.created_at ASC;

-- 查询用户的最新消息（跨数据库查询）
-- SELECT s.title, m.content, m.created_at 
-- FROM ai_chat_app.chat_sessions s
-- INNER JOIN chat_history.messages m ON s.conversation_id = m.conversation_id
-- WHERE s.user_id = ? AND s.is_deleted = 0
-- ORDER BY m.created_at DESC LIMIT 10;