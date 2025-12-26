/**
 * @fileoverview 认证页面布局组件
 * @description 为登录、注册等认证相关页面提供统一的布局结构
 * @author 开发团队
 * @version 1.0.0
 */

import React, { Suspense } from 'react';
import { Layout as AntLayout, Spin, Alert, Button } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import './index.scss';

const { Content } = AntLayout;

/**
 * 认证布局组件属性接口
 * @interface AuthLayoutProps
 */
interface AuthLayoutProps {
  /** 子组件内容 */
  children: React.ReactNode;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 页面主标题 */
  title?: string;
  /** 页面副标题 */
  subtitle?: string;
  /** 背景图片URL */
  backgroundImage?: string;
  /** 是否显示Logo */
  showLogo?: boolean;
  /** Logo图片URL */
  logoUrl?: string;
  /** Logo文字内容 */
  logoText?: string;
}

/**
 * 错误回退组件
 * @description 当认证页面出现错误时显示的回退界面
 * @param {Object} props - 组件属性
 * @param {Error} props.error - 错误对象
 * @param {Function} props.resetErrorBoundary - 重置错误边界的函数
 */
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
})=> {
  return (
    <div className="auth-error-boundary">
      <Alert
        message="页面出现错误"
        description={error.message}
        type="error"
        showIcon
        action={
          <button onClick={resetErrorBoundary} className="auth-error-retry-btn">
            重试
          </button>
        }
      />
    </div>
  );
};

/**
 * 加载回退组件
 * @description 在认证页面加载过程中显示的loading界面
 */
const LoadingFallback: React.FC = () => {
  return (
    <div className="auth-loading-container">
      <Spin size="large" tip="加载中..." />
    </div>
  );
};

/**
 * 认证页面布局组件
 * @description 为登录、注册、重置密码等认证相关页面提供统一的布局结构
 * @param {AuthLayoutProps} props - 组件属性
 * @example
 * ```tsx
 * <AuthLayout
 *   title="用户登录"
 *   subtitle="请输入您的账号和密码"
 *   showLogo={true}
 *   logoText="我的应用"
 * >
 *   <LoginForm />
 * </AuthLayout>
 * ```
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  loading = false,
  title,
  subtitle,
  backgroundImage,
  showLogo = true,
  logoUrl,
  logoText = 'AI学习助手',
})=> {
  const layoutStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      <AntLayout className="auth-layout" style={layoutStyle}>
        
        <Content className="auth-content">
          <div className="auth-container">
            {/* Logo区域 */}
            {showLogo && (
              <div className="auth-logo">
                {logoUrl && <img src={logoUrl} alt="logo" className="auth-logo-image" />}
                <h1 className="auth-logo-text">{logoText}</h1>
              </div>
            )}

            {/* 标题区域 */}
            {(title || subtitle) && (
              <div className="auth-header">
                {title && <h2 className="auth-title">{title}</h2>}
                {subtitle && <p className="auth-subtitle">{subtitle}</p>}
              </div>
            )}

            {/* 内容区域 */}
            <div className="auth-form-container">
              <Suspense fallback={<LoadingFallback />}>
                {loading ? <LoadingFallback /> : children}
              </Suspense>
            </div>
          </div>
        </Content>
      </AntLayout>
    </ErrorBoundary>
  );
};

export default AuthLayout;
export type { AuthLayoutProps };