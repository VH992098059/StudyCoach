import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    open: false, // Tauri开发模式下不需要自动打开浏览器
    proxy: {
      // 仅代理 WebSocket，不再代理所有顶级路径，避免静态模块被错误代理到后端
      '/ws': {
        target: 'ws://localhost:8000', // 需要跨域代理的本地路径
        ws: true,
        rewrite: (path) => path.replace(/^\/*/, ''),
      },
      // 如需代理后端 HTTP 接口，请在此按需添加精确前缀，例如：
      // '/gateway': { target: 'http://localhost:8000', changeOrigin: true }
    }
  }
})
