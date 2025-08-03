import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    host:'0.0.0.0',
    port:5173,
    open: true, //是否在默认浏览器中自动打开该地址
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
