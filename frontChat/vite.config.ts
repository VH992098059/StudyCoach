import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // 设置构建输出目录以匹配Tauri配置
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  // 预优化依赖，确保 onnxruntime-web 在开发环境中被正确预打包
  optimizeDeps: {
    include: ['onnxruntime-web']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true, // 如果端口被占用则失败，而不是尝试其他端口
    open: true, // Tauri开发模式下不需要自动打开浏览器
    proxy: {
      // 仅代理 WebSocket，不再代理所有顶级路径，避免静态模块被错误代理到后端
      '/ws': {
        target: 'ws://localhost:8000', // 需要跨域代理的本地路径
        ws: true,
        rewrite: (path) => path.replace(/^\/*/, ''),
      },
      // 开发环境代理后端HTTP接口组
      '/gateway': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 生产部署通常通过Nginx使用 /api 作为前缀进行SSE代理
      // 这里保留可选映射，便于本地模拟
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // 如需代理后端 HTTP 接口，请在此按需添加精确前缀，例如：
      // '/gateway': { target: 'http://localhost:8000', changeOrigin: true }
    }
  }
})
