# General Template - 通用React项目模板

一个基于 React 18 + TypeScript + Vite 的现代化前端项目模板，集成了完整的开发环境配置和常用组件库。

## 🚀 特性

- ⚡️ **Vite** - 极速的构建工具和开发服务器
- ⚛️ **React 18** - 最新版本的React，支持并发特性
- 🔷 **TypeScript** - 类型安全的JavaScript超集
- 🎨 **Ant Design** - 企业级UI设计语言和组件库
- 🔄 **Redux Toolkit** - 现代化的状态管理解决方案
- 🧭 **React Router** - 声明式路由管理
- 🛡️ **Error Boundary** - 错误边界处理
- 📱 **响应式设计** - 移动端友好的UI组件
- 🔧 **ESLint + Prettier** - 代码质量和格式化工具
- 🌐 **国际化支持** - 内置中文语言包

## 📦 技术栈

### 核心依赖
- **React** ^18.3.0 - 用户界面库
- **React DOM** ^18.3.0 - React的DOM渲染器
- **TypeScript** ~5.8.3 - 静态类型检查
- **Vite** ^7.0.0 - 构建工具

### UI组件库
- **Ant Design** ^5.26.2 - 企业级UI组件库
- **React Error Boundary** ^6.0.0 - 错误边界组件

### 状态管理
- **Redux Toolkit** ^2.8.2 - 状态管理工具
- **React Redux** ^9.2.0 - React的Redux绑定
- **Redux Persist** ^6.0.0 - 状态持久化

### 路由管理
- **React Router DOM** ^7.6.2 - 客户端路由

### 开发工具
- **ESLint** ^9.29.0 - 代码检查工具
- **Prettier** ^3.6.2 - 代码格式化工具
- **TypeScript ESLint** ^8.34.1 - TypeScript的ESLint规则

## 📁 项目结构

```
general-template/
├── public/                 # 静态资源目录
│   └── vite.svg           # Vite图标
├── src/                   # 源代码目录
│   ├── assets/            # 静态资源
│   ├── components/        # 可复用组件
│   │   ├── AuthLayout/    # 认证页面布局组件
│   │   ├── Home/          # 主页相关组件
│   │   │   ├── Footer/    # 页脚组件
│   │   │   ├── Header/    # 页头组件
│   │   │   └── Layout/    # 布局组件
│   │   └── ResponsiveContainer/ # 响应式容器组件
│   ├── hooks/             # 自定义React Hooks
│   ├── pages/             # 页面组件
│   │   ├── About/         # 关于页面
│   │   ├── Activities/    # 活动页面
│   │   ├── Auth/          # 认证相关页面
│   │   ├── Login/         # 登录页面
│   │   ├── NotFound/      # 404页面
│   │   ├── Products/      # 产品页面
│   │   ├── Register/      # 注册页面
│   │   └── Home.tsx       # 主页组件
│   ├── router/            # 路由配置
│   ├── styles/            # 全局样式
│   ├── types/             # TypeScript类型定义
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 应用主组件
│   ├── App.css            # 应用样式
│   ├── index.css          # 全局样式
│   ├── main.tsx           # 应用入口文件
│   └── vite-env.d.ts      # Vite环境类型定义
├── .gitignore             # Git忽略文件配置
├── eslint.config.js       # ESLint配置
├── index.html             # HTML模板
├── package.json           # 项目依赖配置
├── tsconfig.json          # TypeScript配置
├── tsconfig.app.json      # 应用TypeScript配置
├── tsconfig.node.json     # Node.js TypeScript配置
└── vite.config.ts         # Vite配置
```

## 🛠️ 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install

# 或使用pnpm
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或
yarn dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
# 构建生产版本
npm run build

# 或
yarn build
```

### 预览生产版本

```bash
# 预览构建结果
npm run preview

# 或
yarn preview
```

### 代码检查

```bash
# 运行ESLint检查
npm run lint

# 或
yarn lint
```

## 🎯 核心功能

### 1. 响应式布局
- 基于Ant Design的栅格系统
- 移动端优先的设计理念
- 自适应不同屏幕尺寸

### 2. 组件化架构
- **AuthLayout**: 认证页面统一布局
- **Header**: 顶部导航栏，支持用户登录状态
- **Footer**: 页脚信息展示
- **Layout**: 主页面布局容器
- **ResponsiveContainer**: 响应式容器组件

### 3. 状态管理
- 使用Redux Toolkit进行全局状态管理
- 支持状态持久化
- 类型安全的状态定义

### 4. 路由系统
- 基于React Router的声明式路由
- 支持嵌套路由和动态路由
- 路由守卫和权限控制

### 5. 错误处理
- React Error Boundary错误边界
- 优雅的错误页面展示
- 错误日志收集

## 🔧 配置说明

### Vite配置
项目使用Vite作为构建工具，配置文件为 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### TypeScript配置
项目采用严格的TypeScript配置，主要配置文件：
- `tsconfig.json` - 项目根配置
- `tsconfig.app.json` - 应用代码配置
- `tsconfig.node.json` - Node.js环境配置

### ESLint配置
使用现代化的ESLint配置，支持：
- TypeScript语法检查
- React Hooks规则
- React Refresh规则

## 📱 组件使用示例

### 基础布局使用

```tsx
import Layout from './components/Home/Layout';

function App() {
  return (
    <Layout
      headerProps={{
        title: '应用标题',
        menuItems: menuItems,
        user: currentUser,
        onLogin: handleLogin,
        onLogout: handleLogout,
      }}
      footerProps={{
        companyName: '公司名称',
        contactInfo: {
          email: 'contact@example.com',
          phone: '+86 123-4567-8900',
        },
      }}
    >
      {/* 页面内容 */}
    </Layout>
  );
}
```

### 响应式容器使用

```tsx
import ResponsiveContainer from './components/ResponsiveContainer';

function MyPage() {
  return (
    <ResponsiveContainer
      maxWidth="1200px"
      padding={{
        desktop: '24px',
        tablet: '16px',
        mobile: '12px',
      }}
    >
      {/* 页面内容 */}
    </ResponsiveContainer>
  );
}
```

## 🎨 样式指南

### CSS模块化
- 每个组件都有对应的CSS文件
- 使用BEM命名规范
- 支持CSS变量和主题定制

### 响应式断点
```css
/* 移动端 */
@media (max-width: 768px) { }

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) { }

/* 桌面端 */
@media (min-width: 1025px) { }
```

## 🚀 部署

### 构建优化
- 自动代码分割
- Tree-shaking优化
- 资源压缩和缓存

### 部署平台
支持部署到以下平台：
- Vercel
- Netlify
- GitHub Pages
- 自定义服务器

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 构建工具
- [Ant Design](https://ant.design/) - UI组件库
- [TypeScript](https://www.typescriptlang.org/) - 类型系统

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 邮箱: adobePs9920@outlook.com
- GitHub Issues: [提交问题](https://github.com/VH992098059/general-template/issues)

---
修改测试
**Happy Coding! 🎉**
