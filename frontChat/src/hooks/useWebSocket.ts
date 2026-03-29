/**
 * WebSocket Hook - 用于定时任务完成等实时通知
 * 连接 /gateway/ws，支持 ready、cron_complete、pong 等消息
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { API_CONFIG } from '@/utils/axios/config';

export type WSConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WsMessage {
  type: string;
  payload?: Record<string, unknown>;
  status?: string;
}

function getWsUrl(): string {
  const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const wsProtocol = base.startsWith('https') ? 'wss:' : 'ws:';
  const host = base.replace(/^https?:\/\//, '');
  return `${wsProtocol}//${host}/gateway/ws`;
}

export interface UseWebSocketOptions {
  /** 是否启用连接（如页面可见时才连接） */
  enabled?: boolean;
  /** 收到 cron_complete 时的回调 */
  onCronComplete?: (payload: { cron_id: number; cron_name: string; success: boolean }) => void;
  /** 收到任意消息时的回调 */
  onMessage?: (msg: WsMessage) => void;
  /** 连接状态变化 */
  onStateChange?: (state: WSConnectionState) => void;
  /** 重连间隔 ms */
  reconnectInterval?: number;
  /** 最大重连次数，0 表示无限 */
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    onCronComplete,
    onMessage,
    onStateChange,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [state, setState] = useState<WSConnectionState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCronCompleteRef = useRef(onCronComplete);
  const onMessageRef = useRef(onMessage);
  onCronCompleteRef.current = onCronComplete;
  onMessageRef.current = onMessage;

  const setStateAndNotify = useCallback(
    (newState: WSConnectionState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  const connect = useCallback(() => {
    if (!enabled) return;

    const url = getWsUrl();
    setStateAndNotify('connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectCountRef.current = 0;
        setStateAndNotify('connected');
        // 可选：发送 auth（若已登录）
        const token = localStorage.getItem('access_token');
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token: `Bearer ${token}` }));
        }
        // 启动心跳
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
        (ws as unknown as { _pingInterval?: ReturnType<typeof setInterval> })._pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WsMessage;
          onMessageRef.current?.(msg);

          if (msg.type === 'cron_complete' && msg.payload && onCronCompleteRef.current) {
            const p = msg.payload as { cron_id?: number; cron_name?: string; success?: boolean };
            onCronCompleteRef.current({
              cron_id: p.cron_id ?? 0,
              cron_name: String(p.cron_name ?? ''),
              success: Boolean(p.success),
            });
          }
        } catch {
          // 非 JSON 消息忽略
        }
      };

      ws.onerror = () => {
        setStateAndNotify('error');
      };

      ws.onclose = () => {
        const pingInterval = (ws as unknown as { _pingInterval?: ReturnType<typeof setInterval> })._pingInterval;
        if (pingInterval) clearInterval(pingInterval);
        wsRef.current = null;
        setStateAndNotify('disconnected');

        if (enabled && (maxReconnectAttempts === 0 || reconnectCountRef.current < maxReconnectAttempts)) {
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[useWebSocket] connect error:', err);
      setStateAndNotify('error');
    }
  }, [enabled, onStateChange, reconnectInterval, maxReconnectAttempts, setStateAndNotify]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStateAndNotify('disconnected');
  }, [setStateAndNotify]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { state, connect, disconnect };
}
