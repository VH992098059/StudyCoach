/**
 * @fileoverview SSE 连接状态常量
 * @description 供 useSSEChat、BubbleMessageList 等组件使用
 */

/**
 * SSE连接状态常量
 */
export const SSEConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
} as const;

export type SSEConnectionState = typeof SSEConnectionState[keyof typeof SSEConnectionState];
