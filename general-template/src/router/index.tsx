/**
 * @fileoverview 路由配置文件
 * @description 定义应用的路由结构，包括路由守卫、懒加载、布局包装等功能
 * @author 开发团队
 * @version 1.0.0
 */

import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import Layout from '../components/Home/Layout';
import type { MenuProps } from 'antd';

/**
 * 懒加载页面组件
 * @description 使用React.lazy实现代码分割，提高应用性能
 */
const About = React.lazy(() => import('../pages/About'));
const AiChat = React.lazy(() => import('../pages/AiChat'));
const Activities = React.lazy(() => import('../pages/Activities'));
const NotFound = React.lazy(() => import('../pages/NotFound'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const ResetPassword = React.lazy(() => import('../pages/Auth/ResetPassword'));

/**
 * 加载中组件
 * @description 在懒加载组件加载过程中显示的loading界面
 */
const LoadingComponent: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px' 
  }}>
    <Spin size="large" tip="页面加载中..." />
  </div>
);

/**
 * 路由守卫组件属性接口
 * @interface RouteGuardProps
 */
interface RouteGuardProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 是否需要身份验证 */
  requireAuth?: boolean;
}

/**
 * 路由守卫组件
 * @description 用于控制页面访问权限，可以根据用户认证状态决定是否允许访问
 * @param {RouteGuardProps} props - 组件属性
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children, requireAuth = false }) => {
  // 这里可以添加认证逻辑
  // const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  // 暂时不实现认证逻辑，直接返回子组件
  if (requireAuth) {
    // 如果需要认证但未登录，可以重定向到登录页
    // if (!isAuthenticated) {
    //   return <Navigate to="/login" replace />;
    // }
  }
  
  return <>{children}</>;
};

/**
 * 布局包装组件属性接口
 * @interface LayoutWrapperProps
 */
interface LayoutWrapperProps {
  /** 子组件 */
  children: React.ReactNode;
}

/**
 * 带布局的页面包装组件
 * @description 为页面提供统一的布局结构，包括头部导航、底部信息等
 * @param {LayoutWrapperProps} props - 组件属性
 */
const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  /**
   * 导航菜单项配置
   * @description 定义头部导航菜单的结构和内容
   */
  const menuItems: MenuProps['items'] = [
    {
      key: 'aichat',
      label: 'AI聊天',
    },
    {
      key: 'activities',
      label: '活动',
    },
    {
      key: 'about',
      label: '关于',
    },
  ];

  /**
   * 用户状态
   * @description 从localStorage或sessionStorage中获取用户登录状态
   */
  const [user, setUser] = React.useState<{ name: string; avatar?: string } | undefined>(() => {
    // 尝试从localStorage获取用户信息
    const localUserInfo = localStorage.getItem('userInfo');
    if (localUserInfo) {
      try {
        const userInfo = JSON.parse(localUserInfo);
        return { name: userInfo.username, avatar: userInfo.avatar };
      } catch (error) {
        console.error('解析localStorage用户信息失败:', error);
      }
    }
    
    // 尝试从sessionStorage获取用户信息
    const sessionUserInfo = sessionStorage.getItem('userInfo');
    if (sessionUserInfo) {
      try {
        const userInfo = JSON.parse(sessionUserInfo);
        return { name: userInfo.username, avatar: userInfo.avatar };
      } catch (error) {
        console.error('解析sessionStorage用户信息失败:', error);
      }
    }
    
    return undefined;
  });

  /**
   * 处理用户登录
   * @description 跳转到登录页面
   */
  const handleLogin = (): void => {
    window.location.href = '/login';
  };

  /**
   * 处理用户登出
   * @description 清除用户登录状态和存储的用户信息
   */
  const handleLogout = (): void => {
    // 清除存储的用户信息
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    
    // 更新用户状态
    setUser(undefined);
    
    // 跳转到首页
    window.location.href = '/';
  };

  /**
   * 处理菜单点击事件
   * @description 处理导航菜单的点击事件，路由跳转在Layout组件内部处理
   * @param {string} key - 菜单项的key值
   */
  const handleMenuClick = (key: string): void => {
    console.log('Menu clicked:', key);
  };

  return (
    <Layout
      menuItems={menuItems}
      user={user}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onMenuClick={handleMenuClick}
    >
      {children}
    </Layout>
  );
};

// 创建路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LayoutWrapper>
        <Suspense fallback={<LoadingComponent />}>
          <Navigate to="/aichat" replace />
        </Suspense>
      </LayoutWrapper>
    ),
  },
  {
    path: '/aichat',
    element: (
      <RouteGuard>
        <LayoutWrapper>
          <Suspense fallback={<LoadingComponent />}>
            <AiChat />
          </Suspense>
        </LayoutWrapper>
      </RouteGuard>
    ),
  },
  {
    path: '/activities',
    element: (
      <RouteGuard>
        <LayoutWrapper>
          <Suspense fallback={<LoadingComponent />}>
            <Activities />
          </Suspense>
        </LayoutWrapper>
      </RouteGuard>
    ),
  },
  {
    path: '/about',
    element: (
      <RouteGuard>
        <LayoutWrapper>
          <Suspense fallback={<LoadingComponent />}>
            <About />
          </Suspense>
        </LayoutWrapper>
      </RouteGuard>
    ),
  },
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
    path: '*',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default router;
