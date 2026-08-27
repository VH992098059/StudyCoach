/**
 * 认证页面布局（设计文档 4.6，shadcn 版）
 * 居中卡片（360px）：logo 方标 + 标题/副标题 + 表单区
 * 右上角悬浮主题切换；无顶栏导航
 */

import React from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';

export interface AuthLayoutProps {
  /** 子组件内容 */
  children: React.ReactNode;
  /** 页面主标题 */
  title?: string;
  /** 页面副标题 */
  subtitle?: string;
}

/** 错误回退：页面异常时展示，可重试 */
const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    <div className="w-full rounded-md border border-danger/40 bg-surface px-4 py-3.5">
      <div className="text-[13px] font-medium text-danger">{t('common.pageError')}</div>
      <div className="mt-1 text-xs leading-relaxed text-text-3">{message}</div>
      <Button size="sm" variant="outline" className="mt-3" onClick={resetErrorBoundary}>
        {t('common.retry')}
      </Button>
    </div>
  );
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { t } = useTranslation();
  const appName = t('common.appTitle');

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
        {/* 右上角悬浮主题切换 */}
        <div className="absolute right-4 top-4">
          <ThemeToggle className="size-8 rounded-md" />
        </div>

        <div className="w-full max-w-[360px]">
          {/* logo 方标 + 应用名 */}
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-sm bg-primary text-[15px] font-semibold text-primary-foreground">
              {appName.charAt(0)}
            </div>
            <span className="text-[15px] font-semibold tracking-wide text-text-1">{appName}</span>
          </div>

          {/* 标题区 */}
          {(title || subtitle) && (
            <div className="mb-5 text-center">
              {title && <h1 className="text-lg font-semibold text-text-1">{title}</h1>}
              {subtitle && <p className="mt-1 text-[12.5px] leading-relaxed text-text-3">{subtitle}</p>}
            </div>
          )}

          {/* 卡片内容 */}
          <div className="rounded-md border border-border bg-surface px-5 py-6 sm:px-6">{children}</div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AuthLayout;
