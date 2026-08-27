/**
 * @fileoverview 应用程序入口文件
 * @description React 应用主入口：渲染根组件，配置全局样式与路由
 * - globals.css：Tailwind v4 + 地铁线网设计系统双主题 token
 * - Toaster（sonner）承接全局消息提示
 */

import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './styles/globals.css';
import './i18n';
import router from './router';
import { initTokenExpiryChecker } from './utils/token/tokenExpiryChecker';
import { Toaster } from '@/components/ui/sonner';

// 初始化全局 token 过期检查
initTokenExpiryChecker();

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
