import { useSyncExternalStore } from 'react';

/**
 * 全局主题管理（地铁线网设计系统 · 深浅双主题）
 *
 * - 存储沿用 localStorage['theme']（与旧版 Layout 一致，保留用户既有偏好），
 *   未设置时跟随系统 prefers-color-scheme
 * - 通过 html.dark 类切换 CSS 变量（globals.css），Toaster（sonner）等
 *   组件经 useTheme 读取当前主题
 * - useSyncExternalStore 实现 ThemeToggle 等跨组件同步，
 *   storage 事件实现跨标签页同步
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';
const THEME_CHANGE_EVENT = 'sc:theme-change';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage 不可用（隐私模式等）时跟随系统
  }
  return getSystemTheme();
}

function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

let currentTheme: Theme = readStoredTheme();
applyThemeClass(currentTheme);

function emitChange(): void {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function setTheme(theme: Theme): void {
  currentTheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 存储失败时仅本次会话生效
  }
  applyThemeClass(theme);
  emitChange();
}

function handleStorageChange(e: StorageEvent): void {
  if (e.key !== THEME_KEY) return;
  // 其他标签页修改主题时同步（e.newValue 为 null 表示被清除，跟随系统）
  currentTheme =
    e.newValue === 'dark' || e.newValue === 'light' ? e.newValue : getSystemTheme();
  applyThemeClass(currentTheme);
  emitChange();
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener('storage', handleStorageChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener('storage', handleStorageChange);
  };
}

function getSnapshot(): Theme {
  return currentTheme;
}

export function useTheme(): {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
} {
  const theme = useSyncExternalStore(subscribe, getSnapshot);
  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    setTheme,
  };
}
