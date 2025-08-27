/// <reference types="vite/client" />

// Tauri类型定义
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export {};