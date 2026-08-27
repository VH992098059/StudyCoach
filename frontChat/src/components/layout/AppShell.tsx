import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { ScHeader, type ScHeaderUser } from './ScHeader';
import { LoginRegisterService } from '@/services/login_register';
import { clearAuthStorage } from '@/utils/axios/interceptors';

/**
 * 页面错误回退（Tailwind 样式，替代旧版 antd Alert）
 */
const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    <div className="flex flex-1 items-start justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-danger/30 bg-danger-bg p-5">
        <div className="text-sm font-medium text-danger">{t('common.pageError')}</div>
        <div className="mt-2 text-xs leading-relaxed text-text-2">{message}</div>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="mt-4 cursor-pointer rounded-sm border border-danger px-4 py-1.5 text-xs text-danger transition-colors hover:bg-danger-bg"
        >
          {t('common.retry')}
        </button>
      </div>
    </div>
  );
};

/**
 * 懒加载回退（CSS spinner，替代旧版 antd Spin）
 */
const LoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
      <span className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-primary" />
      <span className="text-xs text-text-3">{t('common.loading')}</span>
    </div>
  );
};

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * 应用外壳（替代旧版 Home/Layout + LayoutWrapper）
 *
 * - ScHeader：地铁线网风格顶栏（3 项导航 + 主题切换 + 头像菜单）
 * - 用户状态逻辑自旧 LayoutWrapper 原样迁移（localStorage/sessionStorage
 *   读取、auth:logout 与 storage 跨标签页同步、登出清理）
 * - 页面过渡：0.25s fade-in-up，缓动统一 cubic-bezier(0.16, 1, 0.3, 1)
 * - 旧版 Footer 移除（新设计信息架构不含页脚）
 */
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();

  const [user, setUser] = React.useState<ScHeaderUser | undefined>(() => {
    // token 不存在时，不显示用户信息（避免 token 过期后仍显示账号）
    if (!localStorage.getItem('access_token')) {
      return undefined;
    }
    const localUserInfo = localStorage.getItem('userInfo');
    if (localUserInfo) {
      try {
        const userInfo = JSON.parse(localUserInfo);
        return { name: userInfo.username, avatar: userInfo.avatar };
      } catch (error) {
        console.error('解析localStorage用户信息失败:', error);
      }
    }
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

  const handleLogin = (): void => {
    window.location.href = '/login';
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await LoginRegisterService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
    clearAuthStorage();
    setUser(undefined);
    // 刷新并留在当前页面（不跳转登录页）
    window.location.reload();
  };

  /**
   * 跨标签页/组件的用户状态同步（自旧 LayoutWrapper 原样迁移）
   */
  React.useEffect(() => {
    const handleAuthLogout = () => setUser(undefined);
    window.addEventListener('auth:logout', handleAuthLogout);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo') {
        if (e.newValue) {
          try {
            const userInfo = JSON.parse(e.newValue);
            setUser({ name: userInfo.username, avatar: userInfo.avatar });
          } catch (error) {
            console.error('解析存储变化的用户信息失败:', error);
          }
        } else {
          setUser(undefined);
        }
      }
      // 其他标签页移除 token 时同步清除用户状态
      if (e.key === 'access_token' && !e.newValue) {
        setUser(undefined);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <ScHeader user={user} onLogin={handleLogin} onLogout={handleLogout} />
        <main className="flex flex-1 flex-col">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-1 flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AppShell;
