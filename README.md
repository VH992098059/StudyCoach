# StudyCoach - AI智能学习助手

<div align="center">

![StudyCoach Logo](https://img.shields.io/badge/StudyCoach-AI%20Learning%20Assistant-blue?style=for-the-badge)

一个基于大语言模型的智能学习助手系统，集成了知识库检索、文档处理、AI对话等功能的全栈应用。

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.3.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26.2-0170FE?style=flat-square&logo=ant-design)](https://ant.design/)

</div>

## 🚀 项目特性

### 🤖 AI智能对话 ✅

- **多模型支持**: 支持OpenAI GPT系列模型
- **流式响应**: 实时流式对话体验（基于SSE实现）
- **会话管理**: 本地存储的多会话管理（localStorage）
- **消息历史**: 完整的对话历史记录

### 📚 知识库检索 🔄

- **文档解析**: 支持PDF、HTML等多种文档格式
- **向量检索**: 基于Elasticsearch的语义搜索
- **RAG增强**: 结合检索增强生成，提供更准确的答案
- **MinIO存储**: 文档对象存储和管理

### 🔍 智能搜索 ✅

- **网络搜索**: 集成DuckDuckGo搜索引擎
- **实时信息**: 获取最新的网络信息
- **搜索结果整合**: 智能整合搜索结果并生成回答
- **代理支持**: 支持代理访问外部搜索服务

### 💾 数据存储 ✅

- **MySQL数据库**: 用户信息、会话管理
- **Redis缓存**: 提升系统性能
- **MinIO对象存储**: 文档和媒体文件存储
- **Elasticsearch**: 全文搜索和向量检索

### 🎨 现代化前端 ⚠️ 部分完成

- **响应式设计**: 支持桌面端和移动端
- **组件化架构**: 基于React 18和TypeScript
- **UI组件库**: Ant Design企业级组件
- **路由管理**: React Router DOM路由系统
- **状态管理**: ❌ Redux Toolkit未实现（当前使用localStorage）

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
- **MySQL 8.0+**: 关系型数据库
- **Redis**: 内存缓存数据库
- **Elasticsearch 8**: 搜索引擎和向量数据库
- **MinIO**: 对象存储服务

### AI技术栈

- **Eino**: 字节跳动AI框架
- **OpenAI API**: GPT模型接口
- **Embedding**: 文本向量化
- **RAG**: 检索增强生成

### 前端技术

- **React 18**: 现代化前端框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速构建工具
- **Ant Design**: 企业级UI组件库
- **Redux Toolkit**: 状态管理
- **React Router**: 路由管理

## 🚀 快速开始

### 环境要求

- Go 1.24+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Elasticsearch 8.0+
- MinIO (可选)

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd studyCoach
```

2. **配置环境变量**

```bash
# 复制环境配置文件
cp studyCoach/.env.example studyCoach/.env

# 编辑配置文件，填入你的API密钥
vim studyCoach/.env
```

环境变量配置示例：

```bash
export Model_Type="Pro/deepseek-ai/DeepSeek-V3"
export Openai_API_Key="your-api-key-here"
export Base_url="https://api.siliconflow.cn/v1"
export ES_ENABLED=false
```

3. **数据库初始化**

```bash
# 创建数据库
mysql -u root -p < general-template/database.sql
```

4. **启动后端服务**

```bash
cd backend
go mod tidy
go run main.go
```

5. **启动前端服务**

```bash
cd general-template
npm install
npm run dev
```

6. **访问应用**

- 前端地址: http://localhost:5173
- 后端API: http://localhost:8000

## 📖 使用指南

### AI对话功能 ✅

1. 打开AI聊天页面（`/aichat`）
2. 输入您的问题或需求
3. 系统通过SSE流式返回AI回答
4. 支持创建、切换和删除多个会话
5. 会话数据存储在浏览器本地存储中

### 知识库检索 🔄

1. 系统支持PDF、HTML等文档格式解析
2. 文档存储在MinIO对象存储中
3. 基于Elasticsearch进行向量检索
4. 通过RAG技术增强AI回答准确性

### 网络搜索 ✅

1. 询问实时信息或最新资讯
2. 系统集成DuckDuckGo搜索引擎
3. 支持代理访问（配置在代码中）
4. 自动整合搜索结果并生成综合回答

### 用户认证 ✅

1. 支持用户注册和登录功能
2. JWT令牌验证机制
3. 用户信息存储在MySQL数据库中

## 📋 项目状态

### ✅ 已完成功能

- **AI聊天系统**: 基于OpenAI API的智能对话，支持流式响应
- **用户认证**: JWT基础认证系统
- **数据库设计**: MySQL数据库结构完整
- **前端界面**: React + TypeScript + Ant Design基础界面

### 🚧 开发中功能

- **会话管理**: 本地存储的多会话管理系统
- **知识库检索**: 基于Elasticsearch的RAG检索系统
- **网络搜索**: 集成DuckDuckGo的实时信息搜索
- **文档处理**: 支持PDF、HTML等格式的文档解析
- **对象存储**: MinIO文件存储系统

### ⚠️ 部分完成功能

- **前端状态管理**: 当前使用localStorage，Redux Toolkit未实现
- **知识库管理界面**: 后端支持完整，前端管理界面待开发
- **用户设置**: 数据库表已创建，前端界面待开发

### ❌ 待开发功能

- **Redux状态管理**: 全局状态管理系统
- **知识库上传界面**: 文档上传和管理的前端界面
- **用户个人中心**: 用户信息管理页面
- **系统设置**: 模型配置、参数调整等设置界面
- **移动端适配**: 响应式设计优化
- **Docker部署**: 容器化部署配置

## 🔧 配置说明

### AI模型配置

- 支持多种大语言模型切换
- 可配置API密钥和基础URL
- 支持自定义模型参数

### 数据库配置

- MySQL: 用户数据、会话管理
- Redis: 缓存和会话存储
- Elasticsearch: 文档检索和向量搜索

### 存储配置

- 本地存储: 开发环境
- MinIO: 生产环境对象存储
- 支持多种存储后端

## 🚀 部署指南

### 开发环境部署

#### 后端部署

```bash
# 进入后端目录
cd backend

# 安装依赖
go mod tidy

# 启动后端服务
go run main.go
```

#### 前端部署

```bash
# 进入前端目录
cd general-template

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产环境部署 ⚠️ 待完善

1. 配置反向代理（Nginx）
2. 设置HTTPS证书
3. 配置数据库连接池
4. 启用Redis集群
5. 配置Elasticsearch集群
6. Docker容器化部署（待开发）

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。


