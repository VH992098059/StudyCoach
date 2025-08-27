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
  server:{
    host:'0.0.0.0',
    port:5173,
    strictPort: true, // 如果端口被占用则失败，而不是尝试其他端口
    open: false, // Tauri开发模式下不需要自动打开浏览器
    proxy:{
      '/*': { //当有 /api开头的地址是，代理到target地址
        target: 'http://localhost:8000', // 需要跨域代理的本地路径
        changeOrigin: true, //是否改变请求源头
        ws: true,
        rewrite: (path) => path.replace(/^\/*/, ''),
      }
    }
  }
})
