/**
 * 全局 Token 过期检查钩子
 * 在应用启动时安装，定期检查 token 过期状态
 */

import { checkAndHandleTokenExpiry, getTokenTimeRemaining } from './tokenValidator';

/**
 * 初始化 token 过期检查
 * 在应用启动时调用一次
 * - 页面加载时检查一次
 * - 每分钟检查一次（当 token 剩余时间小于 10 分钟时）
 * - 监听页面获得焦点时检查一次（防止后台标签页过期）
 */
export const initTokenExpiryChecker = () => {
  // 1. 页面加载时立即检查
  checkAndHandleTokenExpiry();

  // 2. 定期检查 token 过期（每 30 秒检查一次）
  const intervalId = setInterval(() => {
    const remaining = getTokenTimeRemaining(localStorage.getItem('access_token'));
    // 只在 token 存在时检查
    if (remaining !== null) {
      console.debug(`[Token Checker] Token expires in ${remaining} seconds`);
      checkAndHandleTokenExpiry();
    }
  }, 30 * 1000); // 30 秒

  // 3. 页面获得焦点时检查（防止后台标签页过期后用户切换回来还能继续操作）
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.debug('[Token Checker] Page focused, checking token...');
      checkAndHandleTokenExpiry();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 4. 监听登出事件，清除定期检查
  const handleLogout = () => {
    console.debug('[Token Checker] Logout detected, clearing token checker');
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  window.addEventListener('auth:logout', handleLogout);

  // 返回清理函数（如果需要手动清理）
  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('auth:logout', handleLogout);
  };
};
