# StudyCoach - AI学习助手

一个基于AI的智能学习助手系统，集成了知识库检索、网络搜索和智能对话功能。

## 项目特性

- **AI智能对话** ✅ - 基于OpenAI GPT模型的智能对话系统
- **知识库检索** 🔄 - 支持文档上传、解析和向量检索（开发中）
- **智能搜索** 🔄 - 集成DuckDuckGo搜索引擎，提供实时网络信息（开发中）
- **数据存储** ✅ - 使用Elasticsearch进行向量存储和检索
- **现代化前端** 🔄 - React + TypeScript构建的响应式界面（部分完成，Redux Toolkit未实现，当前使用localStorage进行会话管理）

## 项目结构

```
studyCoach/
├── backend/                 # 后端Go服务
│   ├── api/                # API接口层
│   │   ├── ai_chat.go     # AI对话接口
│   │   ├── chat_sessions.go # 会话管理接口
│   │   ├── check_jwt.go   # JWT验证接口
│   │   └── login.go       # 登录接口
│   ├── internal/           # 内部逻辑
│   ├── main.go            # 程序入口
│   ├── go.mod             # Go依赖管理
│   └── ...
├── general-template/        # 前端React应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── AiChat/    # AI对话页面
│   │   │   ├── Activities/ # 活动页面
│   │   │   ├── Auth/      # 认证页面
│   │   │   ├── Login/     # 登录页面
│   │   │   └── Register/  # 注册页面
│   │   ├── components/    # 通用组件
│   │   └── ...
│   ├── package.json       # 前端依赖
│   └── ...
├── studyCoach/             # 核心业务逻辑
│   ├── api/               # API处理
│   ├── eino/              # AI引擎集成
│   ├── indexer/           # 索引管理
│   ├── mcp/               # MCP协议支持
│   └── ...
├── go.mod                  # 根目录Go模块
└── README.md              # 项目说明
```

## 技术栈

### 后端
- **Go** - 主要编程语言
- **GoFrame (GF)** - Web框架
- **Elasticsearch** - 搜索引擎和向量数据库
- **MySQL** - 关系型数据库
- **Redis** - 缓存数据库
- **MinIO** - 对象存储

### AI技术
- **OpenAI GPT** - 大语言模型
- **Eino** - AI工作流引擎
- **向量检索** - 文档相似度搜索
- **DuckDuckGo API** - 网络搜索

### 前端
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架

## 快速开始

### 环境要求
- Go 1.21+
- Node.js 18+
- Elasticsearch 8.x
- MySQL 8.0+
- Redis 6.0+

### 后端部署

1. 克隆项目
```bash
git clone https://github.com/VH992098059/StudyCoach.git
cd StudyCoach
```

2. 配置环境变量
```bash
cp studyCoach/.env.example studyCoach/.env
# 编辑.env文件，配置数据库连接、API密钥等
```

3. 安装依赖并运行
```bash
go mod tidy
cd backend
go run main.go
```

### 前端部署

1. 进入前端目录
```bash
cd general-template
```

2. 安装依赖
```bash
npm install
# 或使用 bun install
```

3. 启动开发服务器
```bash
npm run dev
# 或使用 bun dev
```

## 使用指南

### AI对话功能 ✅
- 支持多轮对话
- 上下文记忆
- 流式响应
- 会话管理

### 知识库检索 🔄
- 文档上传和解析
- 向量化存储
- 语义搜索
- 相关性排序

### 网络搜索 🔄
- 实时搜索结果
- 多源信息整合
- 智能摘要

### 用户认证 ✅
- JWT令牌认证
- 用户注册登录
- 会话管理

## 项目状态

### 已完成功能
- ✅ AI对话功能 - 基础对话、流式响应、上下文管理
- ✅ 用户认证 - 注册、登录、JWT验证
- ✅ 数据库设计 - MySQL表结构、Redis缓存
- ✅ 前端界面 - React组件、路由配置、基础样式

### 开发中功能
- 🔄 知识库检索 - 文档解析、向量存储、检索优化
- 🔄 网络搜索 - DuckDuckGo集成、结果处理
- 🔄 文档处理 - 多格式支持、内容提取
- 🔄 对象存储 - MinIO集成、文件管理
- 🔄 会话管理 - 持久化存储、历史记录

### 部分完成功能
- 🔄 前端状态管理 - 当前使用localStorage，Redux Toolkit待实现
- 🔄 知识库管理界面 - 基础框架已搭建，功能待完善
- 🔄 用户设置 - 界面已创建，后端逻辑待开发

### 待开发功能
- ⏳ Redux状态管理 - 统一状态管理方案
- ⏳ 知识库上传界面 - 文件上传、进度显示
- ⏳ 用户个人中心 - 个人信息、使用统计
- ⏳ 系统监控 - 性能监控、日志管理
- ⏳ API文档 - Swagger文档生成

## 配置说明

### 环境变量
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=studycoach

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASS=

# Elasticsearch配置
ES_HOST=localhost
ES_PORT=9200
ES_USER=elastic
ES_PASS=password

# OpenAI配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# MinIO配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## 部署指南

### 开发环境

**后端部署：**
1. 确保Go 1.21+已安装
2. 配置环境变量文件
3. 启动依赖服务（MySQL、Redis、Elasticsearch）
4. 运行 `go run main.go`

**前端部署：**
1. 确保Node.js 18+已安装
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`

### 生产环境
生产环境部署指南待完善，包括：
- 服务器配置
- 负载均衡
- 数据库优化
- 安全配置

### Docker部署
Docker容器化部署为待开发功能，将包括：
- 多服务容器编排
- 环境隔离
- 自动化部署

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

项目链接: [https://github.com/VH992098059/StudyCoach](https://github.com/VH992098059/StudyCoach)
