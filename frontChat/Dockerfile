# 构建阶段
FROM node:22-alpine AS builder

# 启用 corepack，按 package.json 的 packageManager 字段使用固定版本 pnpm
RUN corepack enable

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存：依赖不变时跳过安装
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm config set registry https://registry.npmmirror.com && pnpm install --frozen-lockfile

# 复制源代码并构建（VITE_API_BASE_URL 由 compose 传入，见 docker-compose.online.yml）
ARG VITE_API_BASE_URL=/gateway
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY . .
RUN pnpm build

# 生产阶段
FROM nginx:1.27-alpine

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
