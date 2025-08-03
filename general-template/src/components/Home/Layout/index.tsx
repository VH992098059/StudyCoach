/**
 * @fileoverview 主页面布局组件
 * @description 为应用主要页面提供统一的布局结构，包括头部、内容区域和底部
 * @author 开发团队
 * @version 1.0.0
 */

import React, { Suspense } from 'react';
import { Layout as AntLayout, Spin, Alert } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import Header from '../Header';
import Footer from '../Footer';
import type { MenuProps } from 'antd';
import './index.css';

const { Content } = AntLayout;

/**
 * 主布局组件属性接口
 * @interface LayoutProps
 */
interface LayoutProps {
  /** 子组件内容 */
  children: React.ReactNode;
  /** 头部组件属性配置 */
  headerProps?: {
    /** Logo图片URL */
    logo?: string;
    /** 网站标题 */
    title?: string;
    /** 导航菜单项 */
    menuItems?: MenuProps['items'];
    /** 当前用户信息 */
    user?: {
      /** 用户名 */
      name: string;
      /** 用户头像URL */
      avatar?: string;
    };
    /** 登录回调函数 */
    onLogin?: () => void;
    /** 登出回调函数 */
    onLogout?: () => void;
    /** 菜单点击回调函数 */
    onMenuClick?: (key: string) => void;
  };
  /** 底部组件属性配置 */
  footerProps?: {
    /** 版权信息 */
    copyright?: string;
    /** 公司名称 */
    companyName?: string;
    /** 友情链接 */
    links?: Array<{
      /** 链接标题 */
      title: string;
      /** 链接地址 */
      url: string;
      /** 是否外部链接 */
      external?: boolean;
    }>;
    /** 联系信息 */
    contactInfo?: {
      /** 邮箱地址 */
      email?: string;
      /** 联系电话 */
      phone?: string;
      /** 联系地址 */
      address?: string;
    };
    /** 社交媒体链接 */
    socialLinks?: Array<{
      /** 社交媒体类型 */
      type: 'github' | 'wechat' | 'qq' | 'custom';
      /** 链接地址 */
      url: string;
      /** 自定义图标 */
      icon?: React.ReactNode;
      /** 链接标题 */
      title?: string;
    }>;
    /** 自定义底部内容 */
    customContent?: React.ReactNode;
  };
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 是否显示底部 */
  showFooter?: boolean;
  /** 内容区域自定义样式类名 */
  contentClassName?: string;
  /** 布局最小高度 */
  minHeight?: string | number;
}

/**
 * 错误回退组件
 * @description 当页面出现错误时显示的回退界面
 * @param {Object} props - 组件属性
 * @param {Error} props.error - 错误对象
 * @param {Function} props.resetErrorBoundary - 重置错误边界的函数
 */
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
})=> {
  return (
    <div className="error-boundary">
      <Alert
        message="页面出现错误"
        description={error.message}
        type="error"
        showIcon
        action={
          <button onClick={resetErrorBoundary} className="error-retry-btn">
            重试
          </button>
        }
      />
    </div>
  );
};

/**
 * 加载回退组件
 * @description 在页面加载过程中显示的loading界面
 */
const LoadingFallback: React.FC = ()=> {
  return (
    <div className="loading-container">
      <Spin size="large" tip="加载中..." />
    </div>
  );
};

/**
 * 主页面布局组件
 * @description 为应用主要页面提供统一的布局结构，包括头部导航、内容区域和底部信息
 * @param {LayoutProps} props - 组件属性
 * @example
 * ```tsx
 * <Layout
 *   headerProps={{
 *     title: "我的应用",
 *     menuItems: menuItems,
 *     user: currentUser,
 *     onLogout: handleLogout
 *   }}
 *   footerProps={{
 *     companyName: "我的公司",
 *     contactInfo: { email: "contact@example.com" }
 *   }}
 * >
 *   <HomePage />
 * </Layout>
 * ```
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  headerProps,
  footerProps,
  loading = false,
  showHeader = true,
  showFooter = true,
  contentClassName,
  minHeight = '100vh',
})=> {
  const layoutStyle: React.CSSProperties = {
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // 可以在这里添加重置逻辑，比如清除错误状态
        window.location.reload();
      }}
    >
      <AntLayout className="main-layout" style={layoutStyle}>
        {/* 顶部导航 */}
        {showHeader && (
          <Header
            {...headerProps}
          />
        )}

        {/* 主要内容区域 */}
        <Content 
          className={`main-content ${contentClassName || ''}`}
          style={{
            marginTop: showHeader ? '64px' : '0',
            paddingBottom: showFooter ? '0' : '24px',
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            {loading ? (
              <LoadingFallback />
            ) : (
              <div className="content-wrapper">
                {children}
              </div>
            )}
          </Suspense>
        </Content>

       
      </AntLayout>
    </ErrorBoundary>
  );
};

export default Layout;
export type { LayoutProps };