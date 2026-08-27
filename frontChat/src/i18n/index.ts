import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
};

const DEFAULT_LNG = 'zh';
const STORAGE_KEY = 'i18nextLng';

/** 启动时读取持久化语言，避免用户在 Profile 切换后刷新又回到默认中文 */
function resolveInitialLanguage(): string {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return DEFAULT_LNG;
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* 隐私模式禁用 storage 时忽略 */
  }
  return DEFAULT_LNG;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: resolveInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
    },
  });

/**
 * Profile Select 或其他地方调用 changeLanguage 后立即写到 localStorage，
 * 下次刷新保持用户语言选择。
 * 注意：useTranslation 中的 i18n 实例与本文件 export 的是同一个，
 *       所以在这里监听一个全局事件即可同步。
 */
i18n.on('languageChanged', (lng: string) => {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lng);
    }
  } catch {
    /* ignore */
  }
});

export default i18n;
