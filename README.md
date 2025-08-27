# StudyCoach - AI智能学习助手

<div align="center">

![StudyCoach Logo](https://img.shields.io/badge/StudyCoach-AI%20Learning%20Assistant-blue?style=for-the-badge)

一个基于大语言模型的智能学习助手系统，集成了知识库检索、文档处理、AI对话等功能的全栈应用。

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.3.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26.2-0170FE?style=flat-square&logo=ant-design)](https://ant.design/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

## 🚀 项目特性

### 🤖 AI智能对话 ✅

- **多模型支持**: 支持OpenAI GPT系列模型和DeepSeek V3等多种模型
- **流式响应**: 实时流式对话体验（基于SSE实现，优化了连接稳定性）
- **会话管理**: 本地存储的多会话管理（localStorage）
- **消息历史**: 完整的对话历史记录
- **连接稳定性**: 优化HTTP客户端超时配置，提高长时间对话的稳定性

### 📚 知识库检索 ✅

- **文档解析**: 支持PDF、HTML等多种文档格式
- **向量检索**: 基于Elasticsearch的语义搜索
- **RAG增强**: 结合检索增强生成，提供更准确的答案
- **MinIO存储**: 文档对象存储和管理
- **智能缓存**: 内容抓取缓存机制，提升响应速度

### 🔍 智能搜索 ✅

- **网络搜索**: 集成DuckDuckGo搜索引擎
- **实时信息**: 获取最新的网络信息
- **搜索结果整合**: 智能整合搜索结果并生成回答
- **代理支持**: 支持代理访问外部搜索服务
- **并发抓取**: 支持并发抓取多个URL内容，提升搜索效率

### 💾 数据存储 ✅

- **MySQL数据库**: 用户信息、会话管理
- **Redis缓存**: 提升系统性能
- **MinIO对象存储**: 文档和媒体文件存储
- **Elasticsearch**: 全文搜索和向量检索

### 🎨 现代化前端 ✅

- **响应式设计**: 支持桌面端和移动端
- **组件化架构**: 基于React 18和TypeScript
- **UI组件库**: Ant Design企业级组件
- **路由管理**: React Router DOM路由系统
- **状态管理**: 基于localStorage的会话状态管理
- **SSE客户端**: 优化的服务器推送事件客户端，支持自动重连

### 🐳 Docker部署 ✅

- **容器化**: 完整的Docker和Docker Compose配置
- **一键部署**: 简化的部署脚本
- **数据持久化**: 容器卷管理确保数据安全
- **环境隔离**: 开发和生产环境分离
- **服务编排**: 多容器协调运行

## 📁 项目结构

```
studyCoach/
├── backend/                    # Go后端服务
│   ├── api/                   # API接口定义
│   │   ├── ai_chat/          # AI聊天接口
│   │   ├── chat_sessions/    # 会话管理接口
│   │   ├── check_jwt/        # JWT验证接口
│   │   └── login/            # 登录接口
│   ├── internal/              # 内部业务逻辑
│   │   ├── controller/        # 控制器层
│   │   ├── logic/            # 业务逻辑层
│   │   └── service/          # 服务层
│   ├── manifest/             # 配置文件
│   └── main.go               # 程序入口
├── general-template/          # React前端应用
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   │   ├── AuthLayout/   # 认证布局组件
│   │   │   ├── Home/         # 首页组件
│   │   │   └── ResponsiveContainer/ # 响应式容器
│   │   ├── pages/           # 页面组件
│   │   │   ├── AiChat/      # AI聊天页面 ✅
│   │   │   ├── Activities/   # 活动页面
│   │   │   ├── Auth/         # 认证页面
│   │   │   ├── Login/        # 登录页面
│   │   │   └── Register/     # 注册页面
│   │   ├── hooks/           # 自定义Hooks
│   │   └── utils/           # 工具函数
│   │       ├── api/          # API工具
│   │       ├── axios/        # HTTP客户端
│   │       └── sse/          # 服务端推送 ✅
│   ├── database.sql         # 数据库结构
│   └── package.json         # 前端依赖
├── docker/                   # Docker配置目录
│   ├── mysql/               # MySQL配置
│   └── redis/               # Redis配置
├── docker-compose.yml       # Docker Compose配置
├── build.bat                # Windows构建脚本
├── build.sh                 # Linux/Mac构建脚本
├── DEPLOYMENT.md            # 部署指南
└── studyCoach/               # 核心AI模块 ✅
    ├── api/                 # AI接口实现
    ├── eino/                # AI模型集成
    ├── indexer/             # 文档索引
    ├── minIO/               # 对象存储
    └── .env                 # 环境配置
```

## 🛠️ 技术栈

### 后端技术

- **Go 1.24**: 高性能后端语言
- **GoFrame v2**: 企业级Go开发框架
- **Eino**: 字节跳动AI框架，支持多种模型集成
- **MySQL 8.0+**: 关系型数据库
- **Redis**: 内存缓存数据库
- **Elasticsearch 8**: 搜索引擎和向量数据库
- **MinIO**: 对象存储服务

### AI技术栈

- **多模型支持**: OpenAI GPT、DeepSeek V3等
- **向量化**: 文本embedding和语义检索
- **RAG**: 检索增强生成技术
- **流式处理**: SSE流式响应，支持长文本生成
- **智能搜索**: 集成网络搜索和内容抓取

### 前端技术

- **React 18**: 现代化前端框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速构建工具
- **Ant Design**: 企业级UI组件库
- **React Router**: 路由管理
- **SSE Client**: 自定义服务器推送事件客户端

### 部署技术

- **Docker**: 容器化技术
- **Docker Compose**: 多容器编排
- **Nginx**: 反向代理（推荐用于生产环境）

## 🚀 快速开始

### 本地开发

1. 克隆仓库
```bash
git clone <repository-url>
cd studyCoach
```

2. 配置环境变量
```bash
# 复制示例环境变量文件
cp studyCoach/.env.example studyCoach/.env
# 编辑环境变量
```

3. 启动后端服务
```bash
cd backend
go run main.go
```

4. 启动前端服务
```bash
cd general-template
npm install
npm run dev
```

### Docker部署

我们提供了完整的Docker部署方案，详细步骤请参考 [部署指南](DEPLOYMENT.md)。

1. 构建应用
```bash
# Windows
build.bat

# Linux/Mac
chmod +x build.sh
./build.sh
```

2. 启动Docker容器
```bash
docker-compose up -d
```

3. 访问应用
```
http://localhost
```

## 🔧 性能优化配置

### HTTP客户端超时设置

为了确保流式响应的稳定性，我们对HTTP客户端进行了以下优化：

- 全局HTTP客户端超时: 300秒
- 网络搜索超时: 30秒
- 内容抓取超时: 30秒

这些设置可以在 `studyCoach/api/openai.go` 和 `studyCoach/configTool/maincontent.go` 文件中进行调整。

### 前端SSE客户端配置

前端SSE客户端配置了以下参数：

- 连接超时: 60秒
- 自动重连: 禁用（由应用层控制）
- 最大重连尝试次数: 3次

## 🔍 故障排除

### SSE连接断开

如果遇到SSE连接断开问题，请检查：

1. 后端HTTP客户端超时设置
2. 网络搜索超时设置
3. Nginx配置（如果使用）

### 数据库连接问题

如果遇到数据库连接问题，请检查：

1. 环境变量配置
2. Docker网络设置
3. 数据库服务状态

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎贡献代码、报告问题或提出新功能建议！


