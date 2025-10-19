# StudyCoach - AI智能学习助手

[中文](./README.md) | [English](./README_EN.md)

<div align="center">

![StudyCoach Logo](https://img.shields.io/badge/StudyCoach-AI%20Learning%20Assistant-blue?style=for-the-badge)

一个基于大语言模型的智能学习助手系统，集成了知识库检索、文档处理、AI对话与语音交互等功能的全栈应用。

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18.3.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.26.2-0170FE?style=flat-square&logo=ant-design)](https://ant.design/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

</div>

## 🚀 项目特性

### 🤖 AI智能对话 ✅

- 多模型支持：OpenAI GPT 系列与 DeepSeek V3
- 流式响应：基于 SSE 实现实时对话体验
- 会话管理：本地存储多会话，完整历史记录
- 连接稳定性：优化 HTTP 客户端超时与重试策略

### 📚 知识库检索 ✅

- 文档解析：支持 PDF、HTML 等多种格式
- 向量检索：基于 Elasticsearch 的语义检索
- RAG 增强：结合检索增强生成，提高准确性
- MinIO 存储：文档对象存储与管理
- 智能缓存：网络内容与搜索结果分层缓存

> RAG 模块参考并使用了 [wangle201210/go-rag](https://github.com/wangle201210/go-rag) 的优秀实现

### 🔍 智能搜索 ✅

- 网络搜索：集成 DuckDuckGo
- 并发抓取：协程并发抓取多个 URL，提升效率

### 🎙️ 语音交互（新增） ✅

- 文本朗读（TTS）：接入硅基流动 API 的 `FunAudioLLM/CosyVoice2-0.5B` 模型，生成高自然度语音并前端流式播放
- 语音通话（ASR）：本地部署 SenseVoice（ROCm 加速）进行低延迟语音识别，形成语音问答闭环
- 前端体验：集成 VAD（语音活动检测）与请求取消（AbortController），完善麦克风释放与播放收尾，减少静音误识与资源占用

### 💾 数据存储 ✅

- PostgreSQL：核心业务数据存储
- Redis：会话与热点数据缓存
- MinIO：对象存储（文档与媒体）
- Elasticsearch：全文检索与向量检索

### 🎨 现代化前端 ✅

- 响应式设计：桌面端与移动端适配
- 组件化架构：React 18 + TypeScript + Ant Design
- 路由与状态：React Router + localStorage 会话状态
- SSE 客户端：优化的事件推送客户端，支持实时流式交互
- 语音录制与播放：麦克风录制、AI朗读播放、通话叠层组件

## 📁 项目结构

```
studyCoach/
├── backend/                    # Go 后端服务
│   ├── api/                    # API 接口定义
│   │   ├── ai_chat/           # AI 聊天接口
│   │   ├── chat_sessions/     # 会话管理接口
│   │   ├── check_jwt/         # JWT 验证接口
│   │   ├── login/             # 登录接口
│   │   ├── rag/               # RAG 检索接口
│   │   └── voice/             # 语音相关接口（TTS/ASR） ✅
│   ├── internal/              # 内部业务逻辑
│   │   ├── controller/        # 控制器层
│   │   ├── logic/             # 业务逻辑层
│   │   └── service/           # 服务层
│   ├── manifest/              # 配置文件
│   └── main.go                # 程序入口
├── general-template/           # React 前端应用
│   ├── src/
│   │   ├── pages/
│   │   │   └── AiChat/        # AI 聊天页面（含语音通话组件） ✅
│   │   ├── utils/
│   │   │   └── sse/           # SSE 客户端封装 ✅
│   └── public/                # 前端静态资源（WASM/ONNX 等）
├── docker/                    # Docker 配置目录
│   ├── postgres/              # PostgreSQL 配置
│   └── redis/                 # Redis 配置
├── docker-compose.yml         # Docker Compose 配置
└── README.md                  # 项目说明
```

## 🛠️ 技术栈

### 后端技术

- Go 1.24、GoFrame v2、Eino（多模型集成）
- PostgreSQL、Redis、Elasticsearch、MinIO


### AI 技术栈

- 对话与生成：OpenAI GPT、DeepSeek V3 等
- 检索增强：RAG（Elasticsearch + 文档向量化）
- 流式处理：SSE 流式响应，低延迟输出
- 语音：
  - TTS：`FunAudioLLM/CosyVoice2-0.5B`（硅基流动 API）
  - ASR：SenseVoice（本地部署，ROCm 加速）
  - 前端：VAD 阈值调优、请求取消与资源释放优化

### 前端技术

- React 18、TypeScript、Vite、Ant Design
- React Router、SSE 客户端、自定义 Hooks
- 语音组件：麦克风录音按钮、语音通话叠层、音频播放收尾处理

### 部署技术

- Docker、Docker Compose
- Nginx（生产环境反向代理，推荐）

## 🚀 快速开始

### 本地开发

1. 克隆仓库

```bash
git clone https://github.com/VH992098059/StudyCoach.git
cd studyCoach
```

2. 配置环境变量（后端/前端）

```bash
# 后端
cp backend/studyCoach/.env.example backend/studyCoach/.env
# 前端
cp general-template/.env.example general-template/.env
```

3. 启动后端服务

```bash
cd backend
go run main.go
```

4. 启动前端服务

```bash
cd general-template
bun install
bun run dev
```

> 语音功能：后端已集成 TTS（硅基流动 API）与本地 ASR（SenseVoice），前端包含录音与播放组件，可直接体验语音朗读与通话。


## 🔧 性能优化配置

- 前端 API 超时：60 秒
- Rerank 服务超时：30 秒
- 模型生成超时：30 秒
- 网络搜索超时：30 秒
- 内容抓取超时：30 秒

对应文件：
- 前端超时：`general-template/src/utils/axios/config.ts`
- 后端超时：`studyCoach/rerank/rerank.go`, `studyCoach/api/retriever.go`
- 其他超时：`studyCoach/api/openai.go`, `studyCoach/configTool/maincontent.go`

## 🔍 故障排除

- 检索空结果或超时：检查前后端超时与 ES 服务状态
- SSE 断开：检查后端 HTTP 超时与代理配置
- 数据库连接：检查环境变量与容器网络
- API 响应格式：确保空数组返回为 `[]`，结构与前端一致
- 语音相关：若麦克风占用或播放未停止，确认前端已开启请求取消与资源释放（VAD pause/destroy、MediaStream track stop）

---

## 📄 许可证

MIT License

## 🤝 贡献

欢迎贡献代码、报告问题或提出新功能建议！
