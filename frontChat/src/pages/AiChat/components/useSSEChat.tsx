/**
 * SSE 聊天 Hook
 * 基于 @ant-design/x-sdk 实现流式对话
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { SSEConnectionState } from '@/utils/sse/sse';
import { XRequest } from '@ant-design/x-sdk';
import { API_CONFIG } from '@/utils/axios/config';
import { clearAuthStorage } from '@/utils/axios/interceptors';
import type { Message, MessagePart } from '@/types/chat';
import { useTranslation } from 'react-i18next';

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
  isStudyMode: boolean;
  isDeepThinking?: boolean;
}

interface ChatParams {
  id: string;
  question?: string;
  multi_content?: MessagePart[];
  knowledge_name: string;
  top_k: number;
  score: number;
  is_network: boolean;
  is_study_mode: boolean;
  is_deep_thinking?: boolean;
  uploaded_files?: string[];
}

/** 最大重连次数，供外部（index.tsx）消费以保持一致 */
export const MAX_RECONNECT_ATTEMPTS = 3;

// --- 工厂函数：创建 AI 消息对象 ---
const createAIMessage = (
  content: string,
  msgId: string,
  reasoningContent?: string
): Message => ({
  id: Date.now(),
  msg_id: msgId,
  content,
  isUser: false,
  timestamp: new Date(),
  ...(reasoningContent ? { reasoningContent } : {}),
});

const useSSEChat = (params: UseSSEChatParams) => {
  const { selectedKnowledge, advancedSettings, isNetworkEnabled, isStudyMode, isDeepThinking = false, generateMsgId, setMessages } = params;
  const { t } = useTranslation();

  // Refs
  const requestRef = useRef<ReturnType<typeof XRequest> | null>(null);
  const accumulatedMessageRef = useRef<string>('');
  const accumulatedReasoningRef = useRef<string>('');
  const isUserStoppedRef = useRef<boolean>(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 用 ref 保存最新 connectionState，解决 onError 闭包陷阱
  const connectionStateRef = useRef<SSEConnectionState>(SSEConnectionState.DISCONNECTED);

  // State
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');
  const [currentReasoningContent, setCurrentReasoningContent] = useState<string>('');
  const [currentToolStatus, setCurrentToolStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);

  // 同步 ref，保持最新值供闭包使用
  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  // --- 重置流式状态 ---
  const resetStreamState = useCallback(() => {
    setCurrentAiMessage('');
    setCurrentReasoningContent('');
    setCurrentToolStatus('');
    accumulatedMessageRef.current = '';
    accumulatedReasoningRef.current = '';
  }, []);

  // 清理请求、定时器、缓存
  const cleanup = useCallback(() => {
    if (requestRef.current) {
      (requestRef.current as any).abort?.();
      requestRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    accumulatedMessageRef.current = '';
  }, []);

  // --- SSE 事件处理器（拆分自巨大的 onUpdate） ---

  const handleErrorEvent = useCallback((chunk: any) => {
    const errorMsg = chunk?.data || t('chat.sse.unknownError');
    console.error('SSE Error Event:', errorMsg);
    const msgLower = String(errorMsg).toLowerCase();
    if (
      (msgLower.includes('token') && (msgLower.includes('invalid') || msgLower.includes('失效') || msgLower.includes('过期'))) ||
      (msgLower.includes('验证') && (msgLower.includes('过期') || msgLower.includes('不存在') || msgLower.includes('非法')))
    ) {
      clearAuthStorage();
    }
    if (accumulatedMessageRef.current) {
      setMessages((prev) => [
        ...prev,
        createAIMessage(accumulatedMessageRef.current, generateMsgId(), accumulatedReasoningRef.current.trim() || undefined),
      ]);
    }
    setConnectionError(errorMsg);
    setConnectionState(SSEConnectionState.ERROR);
    setLoading(false);
    resetStreamState();
  }, [t, generateMsgId, setMessages, resetStreamState]);

  const handleToolStatusEvent = useCallback((chunk: any) => {
    try {
      const data = typeof chunk?.data === 'string' ? JSON.parse(chunk.data) : chunk?.data;
      const name = data?.name || data?.tool || '';
      setCurrentToolStatus(name ? t('chat.thinkChain.executingTool', { name }) : t('chat.thinkChain.executingToolGeneric'));
    } catch {
      setCurrentToolStatus(t('chat.thinkChain.executingToolGeneric'));
    }
  }, [t]);

  const handleDonePayload = useCallback(() => {
    const finalMsg = accumulatedMessageRef.current.trim();
    if (finalMsg) {
      setMessages((prev) => [
        ...prev,
        createAIMessage(finalMsg, generateMsgId(), accumulatedReasoningRef.current.trim() || undefined),
      ]);
    }
    resetStreamState();
    setLoading(false);
    setConnectionState(SSEConnectionState.DISCONNECTED);
  }, [generateMsgId, setMessages, resetStreamState]);

  const handleContentPayload = useCallback((payload: string) => {
    let contentSegment = payload;
    let reasoningSegment = '';
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed?.content === 'string') {
        contentSegment = parsed.content;
      } else if (typeof parsed?.delta === 'string') {
        contentSegment = parsed.delta;
      }
      if (typeof parsed?.reasoning_content === 'string') {
        reasoningSegment = parsed.reasoning_content;
      }
    } catch { /* 非 JSON，当做纯文本 */ }

    // 检查内容是否包含 [DONE] 标记
    if (contentSegment.includes('[DONE]')) {
      const parts = contentSegment.split('[DONE]');
      contentSegment = parts[0];
      accumulatedMessageRef.current += contentSegment;
      setCurrentAiMessage(accumulatedMessageRef.current);
      handleDonePayload();
      return;
    }

    accumulatedMessageRef.current += contentSegment;
    setCurrentAiMessage(accumulatedMessageRef.current);
    if (reasoningSegment) {
      accumulatedReasoningRef.current += reasoningSegment;
      setCurrentReasoningContent(accumulatedReasoningRef.current);
    }
  }, [handleDonePayload]);

  // 建立 SSE 连接，支持重试
  const createConnection = useCallback(async (question: string, sessionId: string, uploadedFiles: string[] = [], multiContent?: MessagePart[], attempt = 0) => {
    if (isUserStoppedRef.current) return;

    const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
    const endpoint = (import.meta as any).env?.MODE === 'production' ? '/api/gateway/chat' : `${base}/gateway/chat`;

    setLoading(true);
    setConnectionState(attempt === 0 ? SSEConnectionState.CONNECTING : SSEConnectionState.RECONNECTING);
    setConnectionError(null);
    if (attempt === 0) {
      resetStreamState();
      setDocumentsCount(0);
    }

    try {
      let isFirstChunk = true;
      const request = XRequest<ChatParams, any>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        params: {
          id: sessionId,
          ...(multiContent ? { multi_content: multiContent } : { question }),
          knowledge_name: selectedKnowledge === 'none' ? '' : selectedKnowledge,
          top_k: advancedSettings.topK,
          score: advancedSettings.score,
          is_network: isNetworkEnabled,
          is_study_mode: isStudyMode,
          is_deep_thinking: isDeepThinking,
          ...(uploadedFiles.length > 0 ? { uploaded_files: uploadedFiles } : {}),
        },
        callbacks: {
          onUpdate: (chunk: any) => {
            if (isUserStoppedRef.current) return;

            if (chunk?.event === 'error') {
              handleErrorEvent(chunk);
              return;
            }

            if (isFirstChunk) {
              setConnectionState(SSEConnectionState.CONNECTED);
              setReconnectAttempts(0);
              isFirstChunk = false;
            }

            if (chunk?.event === 'tool_status') {
              handleToolStatusEvent(chunk);
              return;
            }

            setCurrentToolStatus('');

            // 解析 documents 事件
            const documentsStr = chunk?.documents;
            if (typeof documentsStr === 'string') {
              try {
                const parsed = JSON.parse(documentsStr);
                const docArr = parsed?.document ?? parsed?.Document;
                if (Array.isArray(docArr) && docArr.length > 0) {
                  setDocumentsCount(docArr.length);
                }
              } catch { /* ignore */ }
            }

            let data = chunk?.data ?? '';
            if (typeof chunk === 'string') data = chunk;
            const payload = typeof data === 'string' ? data.trim() : '';

            // 兜底：处理无 event 字段的 tool_status
            try {
              const parsed = JSON.parse(payload);
              if (parsed && (parsed.tool != null || parsed.name != null) && parsed.content == null && parsed.reasoning_content == null && parsed.delta == null) {
                const name = parsed.name || parsed.tool || '';
                setCurrentToolStatus(name ? t('chat.thinkChain.executingTool', { name }) : t('chat.thinkChain.executingToolGeneric'));
                return;
              }
            } catch { /* 非 JSON */ }

            if (payload === '[DONE]') {
              handleDonePayload();
              return;
            }

            setCurrentToolStatus('');
            handleContentPayload(payload);
          },
          onSuccess: () => {
            setCurrentToolStatus('');
            setLoading(false);
            setConnectionState((prev) => {
              if (prev === SSEConnectionState.ERROR) return prev;
              return SSEConnectionState.DISCONNECTED;
            });
          },
          onError: (error: Error) => {
            const errStr = String(error?.message || error || '').toLowerCase();
            if (errStr.includes('401') || (errStr.includes('token') && (errStr.includes('invalid') || errStr.includes('失效') || errStr.includes('过期')))) {
              clearAuthStorage();
            }
            const isAbort = error.name === 'AbortError';
            if (isAbort || isUserStoppedRef.current) {
              if (isUserStoppedRef.current) {
                setLoading(false);
                setConnectionState(SSEConnectionState.DISCONNECTED);
              }
              return;
            }
            console.error('SSE Error:', error);

            // 用 ref 读取最新 connectionState，避免闭包陷阱
            if (connectionStateRef.current === SSEConnectionState.ERROR) return;

            if (attempt < MAX_RECONNECT_ATTEMPTS) {
              const nextAttempt = attempt + 1;
              setReconnectAttempts(nextAttempt);
              setConnectionError(t('chat.sse.reconnecting', { attempt: nextAttempt }));
              setConnectionState(SSEConnectionState.RECONNECTING);
              retryTimerRef.current = setTimeout(() => {
                createConnection(question, sessionId, uploadedFiles, nextAttempt);
              }, 2000);
            } else {
              setConnectionError(t('chat.sse.connectionFailed'));
              setConnectionState(SSEConnectionState.ERROR);
              setLoading(false);
            }
          },
        },
      });

      requestRef.current = request as any;
      (request as any).run();
    } catch (error: any) {
      console.error('Request creation error:', error);
      setLoading(false);
      setConnectionState(SSEConnectionState.ERROR);
    }
  // connectionState 从依赖数组移除，改用 connectionStateRef.current
  }, [selectedKnowledge, advancedSettings, isNetworkEnabled, isStudyMode, isDeepThinking, generateMsgId, setMessages, t,
      resetStreamState, handleErrorEvent, handleToolStatusEvent, handleDonePayload, handleContentPayload]);

  // --- 导出方法 ---

  const send = useCallback((text: string, sessionId: string, uploadedFiles: string[] = [], multiContent?: MessagePart[]) => {
    cleanup();
    isUserStoppedRef.current = false;
    createConnection(text, sessionId, uploadedFiles, multiContent, 0);
  }, [createConnection, cleanup]);

  const stop = useCallback(() => {
    isUserStoppedRef.current = true;
    if (requestRef.current) (requestRef.current as any).abort?.();
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    if (accumulatedMessageRef.current.trim()) {
      setMessages((prev) => [
        ...prev,
        createAIMessage(accumulatedMessageRef.current.trim(), generateMsgId(), accumulatedReasoningRef.current.trim() || undefined),
      ]);
    }

    resetStreamState();
    setLoading(false);
    setConnectionState(SSEConnectionState.DISCONNECTED);
    setConnectionError(null);
  }, [generateMsgId, setMessages, resetStreamState]);

  return {
    connectionState,
    reconnectAttempts,
    connectionError,
    setConnectionError,
    currentAiMessage,
    currentReasoningContent,
    currentToolStatus,
    loading,
    documentsCount,
    send,
    stop,
  };
};

export default useSSEChat;
