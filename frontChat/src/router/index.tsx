/**
 * @fileoverview 路由配置文件
 * @description 应用路由结构：AppShell 外壳 + 路由守卫 + 懒加载。
 * 信息架构调整（见 docs/frontend-redesign-design.md 2.1）：
 * - /indexer、/retriever 独立路由移除，功能并入知识库页 Tab，旧地址重定向
 * - /knowledgebase/:id 详情页（文档表 + 分块面板）
 */

import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import { checkAndHandleTokenExpiry } from '../utils/token/tokenValidator';

/**
 * 懒加载页面组件
 */
const AiChat = React.lazy(() => import('../pages/AiChat'));
const KnowledgeBase = React.lazy(() => import('../pages/KnowledgeBase'));
const KbDetail = React.lazy(() => import('../pages/KnowledgeBase/detail'));
const NotFound = React.lazy(() => import('../pages/NotFound'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const ResetPassword = React.lazy(() => import('../pages/Auth/ResetPassword'));
const CronPage = React.lazy(() => import('../pages/Cron/index'));
const Profile = React.lazy(() => import('../pages/Profile'));

/**
 * 加载中组件（CSS spinner，不依赖 antd）
 */
const LoadingComponent: React.FC = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background">
    <span className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
    <span className="text-xs text-text-3">页面加载中...</span>
  </div>
);

/**
 * 路由守卫组件属性接口
 */
interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 路由守卫组件
 * @description 根据认证状态控制访问，主动检查 token 过期（不依赖后端 401）
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children, requireAuth = false }) => {
  const location = useLocation();
  const token = localStorage.getItem('access_token');

  if (requireAuth) {
    // 主动检查 token 是否过期
    const isExpired = checkAndHandleTokenExpiry();
    if (isExpired) {
      return <Navigate to="/login" state={{ from: location, authRequired: true }} replace />;
    }

    if (!token) {
      return <Navigate to="/login" state={{ from: location, authRequired: true }} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * 应用路由配置
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppShell>
        <Suspense fallback={<LoadingComponent />}>
          <AiChat />
        </Suspense>
      </AppShell>
    ),
  },
  {
    path: '/aichat',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/knowledgebase',
    element: (
      <AppShell>
        <Suspense fallback={<LoadingComponent />}>
          <RouteGuard requireAuth={true}>
            <KnowledgeBase />
          </RouteGuard>
        </Suspense>
      </AppShell>
    ),
  },
  // 知识库详情页（面包屑 + 文档表 + 分块面板）
  {
    path: '/knowledgebase/:id',
    element: (
      <AppShell>
        <Suspense fallback={<LoadingComponent />}>
          <RouteGuard requireAuth={true}>
            <KbDetail />
          </RouteGuard>
        </Suspense>
      </AppShell>
    ),
  },
  // 旧路由重定向（索引器/检索器已并入知识库页 Tab）
  {
    path: '/indexer',
    element: <Navigate to="/knowledgebase" replace />,
  },
  {
    path: '/retriever',
    element: <Navigate to="/knowledgebase" replace />,
  },
  // 认证相关页面（不使用主布局）
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  {
    path: '/cron',
    element: (
      <AppShell>
        <Suspense fallback={<LoadingComponent />}>
          <RouteGuard requireAuth={true}>
            <CronPage />
          </RouteGuard>
        </Suspense>
      </AppShell>
    ),
  },
  {
    path: '/profile',
    element: (
      <AppShell>
        <Suspense fallback={<LoadingComponent />}>
          <RouteGuard requireAuth={true}>
            <Profile />
          </RouteGuard>
        </Suspense>
      </AppShell>
    ),
  },
  // 404页面
  {
    path: '/404',
    element: (
      <AppShell>
        <Suspense fallback={<LoadingComponent />}>
          <NotFound />
        </Suspense>
      </AppShell>
    ),
  },
  // 捕获所有未匹配的路由
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);

export default router;
