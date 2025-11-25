/**
 * @fileoverview SSE 聊天 Hook
 * @description 管理 SSE 连接生命周期、重连策略、消息流式累计与写入，
 * 暴露连接状态与当前生成内容。
 */
import { useRef, useState } from 'react';
import { SSEConnectionState } from '@/utils/sse/sse';
import { XStream } from '@ant-design/x';
import type { Message } from '@/types/chat';

interface AdvancedSettings {
  topK: number;
  score: number;
}

interface UseSSEChatParams {
  selectedKnowledge: string;
  advancedSettings: AdvancedSettings;
  isNetworkEnabled: boolean;
  generateMsgId: () => string;
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
}

const useSSEChat = (params: UseSSEChatParams) => {
  const { selectedKnowledge, advancedSettings, isNetworkEnabled, generateMsgId, setMessages } = params;

  const abortCtrlRef = useRef<AbortController | null>(null);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedMessageRef = useRef<string>('');
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedByUserRef = useRef<boolean>(false);

  const MAX_RECONNECT_ATTEMPTS = 3;
  const CONNECTION_TIMEOUT = 60000;

  const cleanup = () => {
    if (abortCtrlRef.current) {
      try { abortCtrlRef.current.abort(); } catch {}
      abortCtrlRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    accumulatedMessageRef.current = '';
    setConnectionState(SSEConnectionState.DISCONNECTED);
  };

  const createConnection = async (question: string, sessionId: string, currentAttempt = 0) => {
    if (currentAttempt === 0) {
      cleanup();
      setReconnectAttempts(0);
    }

    setConnectionError(null);
    setCurrentAiMessage('');

    const endpoint = (import.meta as any).env?.MODE === 'production' ? '/api/gateway/chat' : '/gateway/chat';
    const controller = new AbortController();
    abortCtrlRef.current = controller;

    try {
      setConnectionState(SSEConnectionState.CONNECTING);
      accumulatedMessageRef.current = '';
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }

      const resp = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          id: sessionId,
          question,
          knowledge_name: selectedKnowledge === 'none' ? '' : selectedKnowledge,
          top_k: advancedSettings.topK,
          score: advancedSettings.score,
          is_network: isNetworkEnabled,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`服务异常: ${resp.status}`);
      }

      setConnectionState(SSEConnectionState.CONNECTED);
      setReconnectAttempts(0);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      connectionTimeoutRef.current = setTimeout(() => {
        if (stoppedByUserRef.current) {
          controller.abort();
          setLoading(false);
          cleanup();
          return;
        }
        setConnectionError('连接超时');
        controller.abort();
        if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
          const nextAttempt = currentAttempt + 1;
          setReconnectAttempts(nextAttempt);
          setConnectionError(`连接超时，正在尝试第 ${nextAttempt} 次重连...`);
          setConnectionState(SSEConnectionState.RECONNECTING);
          setTimeout(() => {
            createConnection(question, sessionId, nextAttempt);
          }, 2000);
        } else {
          setConnectionError('连接超时，已达到最大重连次数');
          setLoading(false);
          cleanup();
        }
      }, CONNECTION_TIMEOUT);

      for await (const chunk of XStream({ readableStream: resp.body })) {
        const data = (chunk as any)?.data ?? '';
        const payload = typeof data === 'string' ? data.trim() : '';

        if (payload === '[DONE]') {
          if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
            updateTimerRef.current = null;
          }
          if (accumulatedMessageRef.current.trim()) {
            const aiMessage: Message = {
              id: Date.now(),
              msg_id: generateMsgId(),
              content: accumulatedMessageRef.current.trim(),
              isUser: false,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            accumulatedMessageRef.current = '';
            setCurrentAiMessage('');
          }
          cleanup();
          setLoading(false);
          break;
        }

        let contentSegment = payload;
        try {
          const parsed = JSON.parse(payload);
          if (typeof parsed?.content === 'string') {
            contentSegment = parsed.content;
          } else if (typeof parsed?.delta === 'string') {
            contentSegment = parsed.delta;
          }
        } catch (_) {
          // 非JSON载荷，按纯文本追加
        }

        accumulatedMessageRef.current += contentSegment;
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }
        updateTimerRef.current = setTimeout(() => {
          setCurrentAiMessage(accumulatedMessageRef.current);
        }, 32);
      }
    } catch (err) {
      setConnectionState(SSEConnectionState.ERROR);
      const aborted = stoppedByUserRef.current || (controller.signal.aborted) || ((err as any)?.name === 'AbortError');
      if (aborted) {
        setLoading(false);
        cleanup();
        return;
      }
      if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
        const nextAttempt = currentAttempt + 1;
        setReconnectAttempts(nextAttempt);
        setConnectionError(`连接失败，正在尝试第 ${nextAttempt} 次重连...`);
        setConnectionState(SSEConnectionState.RECONNECTING);
        setTimeout(() => {
          createConnection(question, sessionId, nextAttempt);
        }, 2000);
      } else {
        setConnectionError('连接失败，已达到最大重连次数，请稍后重试');
        setLoading(false);
        cleanup();
      }
    }
  };

  const send = (text: string, sessionId: string) => {
    setLoading(true);
    setReconnectAttempts(0);
    setConnectionError(null);
    stoppedByUserRef.current = false;
    createConnection(text, sessionId, 0);
  };

  const stop = () => {
    stoppedByUserRef.current = true;
    cleanup();
    setLoading(false);
    setCurrentAiMessage('');
  };

  return {
    connectionState,
    reconnectAttempts,
    connectionError,
    setConnectionError,
    currentAiMessage,
    loading,
    send,
    stop,
  };
};

export default useSSEChat;