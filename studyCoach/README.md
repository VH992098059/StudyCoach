# StudyCoach - AI学习教练

一个基于Go语言开发的AI学习教练系统，集成了多种AI模型、文档检索、文件存储等功能。

## 功能特性

### 🤖 AI聊天功能
- 支持多种AI模型（OpenAI、DeepSeek、Qwen等）
- 流式响应，实时交互体验
- 智能意图分析和任务分发
- 情感陪伴和学习指导

### 🔍 智能检索
- 基于Elasticsearch的文档检索
- 向量化搜索，语义理解
- 网络搜索集成（DuckDuckGo）
- 多模态内容支持

### 📁 文件管理
- MinIO对象存储
- 支持多种文件格式（PDF、HTML、文本等）
- 文件上传和下载
- 自动文档解析和索引

### 🛠️ 工具集成
- MCP（Model Context Protocol）工具适配
- 时间工具（时区转换、当前时间获取）
- 可扩展的工具框架

## 技术架构

### 核心框架
- **Eino**: 字节跳动开源的AI应用开发框架
- **Gin**: 高性能的Go Web框架
- **Elasticsearch**: 分布式搜索和分析引擎
- **MinIO**: 高性能对象存储

### 项目结构
```
studyCoach/
├── api/                    # API接口层
│   └── openai.go          # 聊天和文件处理接口
├── common/                 # 公共组件
│   ├── common.go          # 常量定义
│   ├── es_create.go       # ES索引管理
│   └── value.go           # 提示词模板
├── configTool/            # 配置管理
│   └── config.go          # 系统配置
├── eino/                  # Eino框架组件
│   ├── orchestration.go   # 编排图构建
│   ├── branch.go          # 分支逻辑
│   ├── lambda_func.go     # Lambda函数
│   ├── model.go           # AI模型配置
│   ├── embedding.go       # 嵌入模型
│   ├── retriever.go       # 检索器
│   ├── prompt.go          # 提示词模板
│   ├── flow.go            # 流程控制
│   ├── loader.go          # 文档加载器
│   ├── transformer.go     # 文档转换器
│   ├── tools_node.go      # 工具节点
│   └── indexer.go         # 索引器
├── mcp/                   # MCP工具适配
│   ├── mcpAdapter.go      # 工具适配器
│   └── timemcp.go         # 时间工具
├── minIO/                 # MinIO相关
│   ├── main.go            # MinIO服务
│   ├── config_minio/      # MinIO配置
│   ├── minio_func/        # MinIO功能函数
│   └── display_minio/     # MinIO信息展示
├── .env                   # 环境变量配置
├── go.mod                 # Go模块定义
├── main.go                # 主程序入口
└── README.md              # 项目说明
```

## 快速开始

### 环境要求
- Go 1.21+
- Elasticsearch 8.x
- MinIO
- AI模型API密钥（OpenAI、DeepSeek等）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/VH992098059/StudyCoach.git
cd StudyCoach/studyCoach
```

2. **安装依赖**
```bash
go mod download
```

3. **配置环境变量**

复制并编辑`.env`文件：
```bash
cp .env.example .env
```

配置必要的环境变量：
```env
# AI模型配置
MODEL_TYPE=openai
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# Elasticsearch配置
ELASTICSEARCH_URL=http://localhost:9200
ES_INDEX_NAME=study_coach

# MinIO配置
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=study-coach
```

4. **启动服务**
```bash
go run main.go
```

服务将在 `http://localhost:8080` 启动。

## API接口

### 聊天接口
- `POST /api/v1/chat/message` - 发送聊天消息
- `GET /api/v1/chat/stream` - 流式聊天（SSE）
- `GET /api/v1/chat/history` - 获取聊天历史

### 文档接口
- `GET /api/v1/documents/search` - 搜索文档
- `POST /api/v1/documents/process` - 处理文档索引

### 文件接口
- `POST /api/v1/files/upload` - 文件上传

### 系统接口
- `GET /health` - 健康检查
- `GET /info` - 系统信息

## 使用示例

### 发送聊天消息
```bash
curl -X POST http://localhost:8080/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "帮我制定一个学习计划",
    "user_id": "user123"
  }'
```

### 搜索文档
```bash
curl "http://localhost:8080/api/v1/documents/search?q=机器学习"
```

### 上传文件
```bash
curl -X POST http://localhost:8080/api/v1/files/upload \
  -F "file=@document.pdf"
```

## 开发指南

### 添加新的AI模型
1. 在 `eino/model.go` 中添加模型配置
2. 更新环境变量配置
3. 测试模型集成

### 添加新的工具
1. 在 `mcp/` 目录下创建工具实现
2. 使用 `ToolAdapter` 包装工具
3. 在 `eino/tools_node.go` 中注册工具

### 自定义提示词
1. 在 `common/value.go` 中定义提示词模板
2. 在 `eino/prompt.go` 中创建对应的模板实现
3. 在编排图中使用新模板


### 生产环境配置
- 配置反向代理（Nginx）
- 设置HTTPS证书
- 配置日志收集
- 设置监控和告警

## 贡献

欢迎提交Issue和Pull Request！


## 许可证

MIT License

## 联系方式

- GitHub: [VH992098059](https://github.com/VH992098059)
- 项目地址: [StudyCoach](https://github.com/VH992098059/StudyCoach)
