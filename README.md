# StudyCoach - AI学习教练Agent 🎓

<div align="center">
  <img src="https://img.shields.io/badge/AI-Learning%20Coach-blue?style=for-the-badge&logo=openai" alt="AI Learning Coach">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Go-1.24-00ADD8?style=for-the-badge&logo=go" alt="Go">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
</div>

## 📖 项目简介

StudyCoach 是一个基于AI的智能学习教练Agent，旨在为用户提供个性化、智能化的学习体验。通过先进的AI技术，StudyCoach能够理解用户的学习需求，制定个性化学习计划，推荐优质学习资源，并提供全程学习陪伴。

## ✨ 核心功能

### 🤖 智能对话系统
- **自然语言交互**：支持用户直接描述学习需求和问题
- **多模态输入**：支持文字、语音等多种输入方式
- **实时响应**：展示AI分析过程和思考步骤，增强用户信任感
- **上下文理解**：记忆对话历史，提供连贯的学习指导

### 📅 学习计划管理
- **个性化计划生成**：基于用户目标和能力水平制定学习路径
- **可视化展示**：时间轴、甘特图等多种形式展示学习计划
- **进度跟踪**：实时监控学习进度，支持任务完成状态管理
- **智能调整**：根据学习情况动态调整计划安排
- **里程碑提醒**：重要节点的可视化提醒和成就庆祝

### 📚 资源管理中心
- **智能推荐**：基于学习内容和用户偏好推荐相关资源
- **分类浏览**：按类型、难度、评分等维度组织学习资源
- **个人资源库**：用户收藏和上传的学习资料统一管理
- **评价系统**：用户可对资源进行评分和评论
- **资源搜索**：强大的搜索功能快速定位所需资源

### 🤝 学习陪伴功能
- **情感状态监测**：通过交互分析识别用户学习情绪
- **智能鼓励系统**：根据学习状态提供个性化鼓励和建议
- **学习伙伴匹配**：连接有相似学习目标的用户
- **专注模式**：番茄钟、白噪音等专注学习工具
- **学习提醒**：智能提醒系统帮助养成学习习惯

### 📊 数据分析仪表板
- **学习统计**：学习时长、完成率、知识点掌握情况可视化
- **能力雷达图**：多维度展示用户在不同领域的能力水平
- **效率分析**：最佳学习时间段、效率趋势分析
- **目标预测**：基于当前进度预测目标完成时间
- **学习报告**：定期生成详细的学习分析报告

### ⚙️ 个性化设置
- **学习偏好配置**：学习时间、难度偏好、提醒频率等设置
- **界面主题定制**：多种主题和布局选择
- **通知管理**：灵活的提醒和通知设置
- **隐私控制**：学习数据的隐私级别设置

### 📱 移动端适配
- **响应式设计**：适配不同屏幕尺寸的设备
- **离线学习支持**：关键功能的离线使用能力
- **手势操作**：针对移动设备优化的交互方式
- **推送通知**：学习提醒和重要消息的及时推送

## 🛠️ 技术栈

### 前端技术
- **框架**：React 18.x + TypeScript
- **构建工具**：Bun (高性能JavaScript运行时)
- **状态管理**：Redux Toolkit / Zustand
- **UI组件库**：Ant Design / Material-UI
- **样式方案**：Tailwind CSS / Styled Components
- **图表库**：ECharts / Chart.js

### 后端技术
- **语言**：Go 1.24
- **框架**：GoFrame v2.9
- **AI引擎**：CloudWeGo Eino
- **数据库**：MySQL + MongoDB + Redis
- **搜索引擎**：Elasticsearch
- **消息队列**：Redis Streams
- **文件存储**：MinIO

### AI & 机器学习
- **大语言模型**：OpenAI GPT / 本地部署模型
- **向量数据库**：用于语义搜索和知识检索
- **自然语言处理**：文本分析、情感识别
- **推荐算法**：协同过滤、内容推荐

### 基础设施
- **容器化**：Docker + Docker Compose
- **CI/CD**：GitHub Actions
- **监控**：Prometheus + Grafana
- **日志**：ELK Stack
- **安全**：JWT认证、HTTPS、权限控制

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Go 1.24+
- Docker & Docker Compose
- MySQL 8.0+
- Redis 6.0+
- Elasticsearch 8.0+

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/VH992098059/StudyCoach.git
cd StudyCoach
```

2. **启动基础服务**
```bash
# 启动数据库和中间件
docker-compose up -d mysql redis elasticsearch
```

3. **配置环境变量**
```bash
# 复制配置文件
cp .env.example .env
cp backend/.env.example backend/.env

# 编辑配置文件，填入必要的配置信息
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
bun install
bun dev
```

6. **访问应用**
- 前端地址：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/swagger

## 📁 项目结构

```
StudyCoach/
├── backend/                 # Go后端服务
│   ├── api/                # API接口定义
│   ├── internal/           # 内部业务逻辑
│   │   ├── controller/     # 控制器层
│   │   ├── service/        # 服务层
│   │   ├── dao/           # 数据访问层
│   │   └── model/         # 数据模型
│   ├── manifest/          # 配置文件
│   └── utility/           # 工具函数
├── general-template/       # React前端应用
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── utils/         # 工具函数
│   │   └── router/        # 路由配置
│   └── public/            # 静态资源
├── studyCoach/            # AI核心模块
│   ├── eino/              # AI编排引擎
│   ├── indexer/           # 索引服务
│   ├── mcp/               # MCP协议适配
│   └── configTool/        # 配置工具
├── docker-compose.yml     # Docker编排文件
├── README.md             # 项目说明
└── .env.example          # 环境变量模板
```

## 🔧 开发指南

### 代码规范
- 前端：遵循 ESLint + Prettier 规范
- 后端：遵循 Go 官方代码规范
- 提交：使用 Conventional Commits 规范

### 测试
```bash
# 前端测试
cd general-template
bun test

# 后端测试
cd backend
go test ./...
```

### 构建部署
```bash
# 构建Docker镜像
docker-compose build

# 生产环境部署
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 贡献方式
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [CloudWeGo Eino](https://github.com/cloudwego/eino) - AI编排引擎
- [GoFrame](https://github.com/gogf/gf) - Go开发框架
- [React](https://reactjs.org/) - 前端框架
- [OpenAI](https://openai.com/) - AI模型支持

## 📞 联系我们

- 项目主页：https://github.com/VH992098059/StudyCoach
- 问题反馈：https://github.com/VH992098059/StudyCoach/issues
- 邮箱：[your-email@example.com]

---

<div align="center">
  <p>如果这个项目对你有帮助，请给我们一个 ⭐️</p>
  <p>Made with ❤️ by StudyCoach Team</p>
</div>