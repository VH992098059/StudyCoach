/**
 * 聊天设置持久化 Hook
 * 按用户 ID（uuid）保存学习模式、深度思考、联网搜索等设置到 localStorage
 * - 已登录：key = chat_settings_{uuid}
 * - 未登录：key = chat_settings_anonymous
 * 使用 localStorage 实现随时保存，无网络请求，不卡顿
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'chat_settings_';

export interface ChatSettings {
  isStudyMode: boolean;
  isDeepThinking: boolean;
  isNetworkEnabled: boolean;
}

const DEFAULT_SETTINGS: ChatSettings = {
  isStudyMode: false,
  isDeepThinking: false,
  isNetworkEnabled: false,
};

function getStorageKey(): string {
  try {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      const uuid = userInfo?.uuid;
      if (uuid) return `${STORAGE_PREFIX}${uuid}`;
    }
  } catch {
    // ignore parse error
  }
  return `${STORAGE_PREFIX}anonymous`;
}

function loadSettings(): ChatSettings {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ChatSettings>;
      return {
        isStudyMode: parsed.isStudyMode ?? DEFAULT_SETTINGS.isStudyMode,
        isDeepThinking: parsed.isDeepThinking ?? DEFAULT_SETTINGS.isDeepThinking,
        isNetworkEnabled: parsed.isNetworkEnabled ?? DEFAULT_SETTINGS.isNetworkEnabled,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: ChatSettings): void {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // ignore quota exceeded etc
  }
}

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());

  // 用户切换时重新加载（localStorage/sessionStorage 的 userInfo 变化）
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // 监听 storage 事件（多标签页同步）及 auth:logout（登出后切换为匿名 key）
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(STORAGE_PREFIX) || e.key === 'userInfo') {
        setSettings(loadSettings());
      }
    };
    const handleAuthLogout = () => setSettings(loadSettings());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleStudyMode = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, isStudyMode: !prev.isStudyMode };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleDeepThinking = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, isDeepThinking: !prev.isDeepThinking };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleNetwork = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, isNetworkEnabled: !prev.isNetworkEnabled };
      saveSettings(next);
      return next;
    });
  }, []);

  return {
    isStudyMode: settings.isStudyMode,
    isDeepThinking: settings.isDeepThinking,
    isNetworkEnabled: settings.isNetworkEnabled,
    setSettings: updateSettings,
    toggleStudyMode,
    toggleDeepThinking,
    toggleNetwork,
  };
}
