/**
 * @fileoverview 主页面布局组件
 * @description 为应用主要页面提供统一的布局结构，包括头部、内容区域和底部
 * @author 开发团队
 * @version 1.0.0
 */

import React, { Suspense } from 'react';
import { Layout as AntLayout, Spin, Alert, ConfigProvider, theme } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Header from '../Header';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import './index.scss';

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
    isDark?: boolean;
    onToggleTheme?: (checked: boolean) => void;
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
}) => {
  const { t } = useTranslation();
  return (
    <div className="error-boundary">
      <Alert
        title={t('common.pageError')}
        description={error.message}
        type="error"
        showIcon
        action={
          <button onClick={resetErrorBoundary} className="error-retry-btn">
            {t('common.retry')}
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
const LoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="loading-container">
      <Spin size="large" tip={t('common.loading')} />
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
}) => {
  const layoutStyle: React.CSSProperties = {
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
  };

  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const handleToggleTheme = (checked: boolean) => {
    setIsDark(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  const location = useLocation();

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // 可以在这里添加重置逻辑，比如清除错误状态
        window.location.reload();
      }}
    >
      <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        <AntLayout className={`main-layout ${isDark ? 'dark' : ''}`} style={layoutStyle}>
          {/* 顶部导航 */}
          {showHeader && (
            <Header
              {...headerProps}
              isDark={isDark}
              onToggleTheme={handleToggleTheme}
            />
          )}

        {/* 主要内容区域 */}
        <Content
          className={`main-content ${contentClassName || ''}`}
        >
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              {loading ? (
                <LoadingFallback />
              ) : (
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="content-wrapper"
                >
                  {children}
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </Content>


        </AntLayout>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default Layout;
export type { LayoutProps };