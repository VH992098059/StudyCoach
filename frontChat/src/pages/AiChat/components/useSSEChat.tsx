/**
 * SSE 聊天 Hook
 * 基于 @ant-design/x-sdk 实现流式对话
 */
import { useRef, useState, useCallback } from 'react';
import { SSEConnectionState } from '@/utils/sse/sse';
import { XRequest } from '@ant-design/x-sdk';
import { API_CONFIG } from '@/utils/axios/config';
import { clearAuthStorage } from '@/utils/axios/interceptors';
import type { Message } from '@/types/chat';
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
  question: string;
  knowledge_name: string;
  top_k: number;
  score: number;
  is_network: boolean;
  is_study_mode: boolean;
  is_deep_thinking?: boolean;
  uploaded_files?: string[];
}

const useSSEChat = (params: UseSSEChatParams) => {
  const { selectedKnowledge, advancedSettings, isNetworkEnabled, isStudyMode, isDeepThinking = false, generateMsgId, setMessages } = params;
  const { t } = useTranslation();

  // --- Refs ---
  // 请求实例，使用 any 规避复杂的泛型类型兼容问题
  const requestRef = useRef<any>(null);
  // 消息缓存
  const accumulatedMessageRef = useRef<string>('');
  // 思考过程缓存（深度思考模式）
  const accumulatedReasoningRef = useRef<string>('');
  // 用户是否手动停止
  const isUserStoppedRef = useRef<boolean>(false);
  // 重连定时器
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- State ---
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');
  const [currentReasoningContent, setCurrentReasoningContent] = useState<string>('');
  const [currentToolStatus, setCurrentToolStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);

  const MAX_RECONNECT_ATTEMPTS = 3;

  // --- 清理函数 ---
  const cleanup = useCallback(() => {
    // 中断请求
    if (requestRef.current) {
      requestRef.current.abort();
      requestRef.current = null;
    }

    // 清除定时器
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // 清空缓存
    accumulatedMessageRef.current = '';
  }, []);

  // --- 建立连接 ---
  const createConnection = useCallback(async (question: string, sessionId: string, uploadedFiles: string[] = [], attempt = 0) => {
    // 已停止则不发起请求
    if (isUserStoppedRef.current) return;

    const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
    const endpoint = (import.meta as any).env?.MODE === 'production' ? '/api/gateway/chat' : `${base}/gateway/chat`;

    setLoading(true);
    setConnectionState(attempt === 0 ? SSEConnectionState.CONNECTING : SSEConnectionState.RECONNECTING);
    setConnectionError(null);
    if (attempt === 0) {
        setCurrentAiMessage('');
        setCurrentReasoningContent('');
        setCurrentToolStatus('');
        accumulatedMessageRef.current = '';
        accumulatedReasoningRef.current = '';
        setDocumentsCount(0);
    }

    try {
      let isFirstChunk = true;
      // 使用 XRequest 发起请求
      const request = XRequest<ChatParams, any>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        params: {
          id: sessionId,
          question,
          knowledge_name: selectedKnowledge === 'none' ? '' : selectedKnowledge,
          top_k: advancedSettings.topK,
          score: advancedSettings.score,
          is_network: isNetworkEnabled,
          is_study_mode: isStudyMode,
          is_deep_thinking: isDeepThinking,
          ...(uploadedFiles.length > 0 ? { uploaded_files: uploadedFiles } : {}),
        },
        // 处理 SSE 流
    
        callbacks: {
          onUpdate: (chunk: any) => {
            if (isUserStoppedRef.current) return;

            // 检查错误事件
            if (chunk?.event === 'error') {
              const errorMsg = chunk?.data || t('chat.sse.unknownError');
              console.error('SSE Error Event:', errorMsg);
              // token 无效时自动退出登录
              const msgLower = String(errorMsg).toLowerCase();
              if (msgLower.includes('token') && (msgLower.includes('invalid') || msgLower.includes('失效') || msgLower.includes('过期')) ||
                  msgLower.includes('验证') && (msgLower.includes('过期') || msgLower.includes('不存在') || msgLower.includes('非法'))) {
                clearAuthStorage();
              }
              // 如果有累积的消息，先保存
              if (accumulatedMessageRef.current) {
                  const finalReasoning = accumulatedReasoningRef.current.trim();
                  const aiMessage: Message = {
                    id: Date.now(),
                    msg_id: generateMsgId(),
                    content: accumulatedMessageRef.current,
                    isUser: false,
                    timestamp: new Date(),
                    ...(finalReasoning ? { reasoningContent: finalReasoning } : {}),
                  };
                  setMessages((prev) => [...prev, aiMessage]);
              }
              
              setConnectionError(errorMsg);
              setConnectionState(SSEConnectionState.ERROR);
              setLoading(false);
              setCurrentAiMessage('');
              setCurrentReasoningContent('');
              accumulatedMessageRef.current = '';
              accumulatedReasoningRef.current = '';
              return;
            }
            
            // 首次收到数据标记为已连接
            if (isFirstChunk) {
               setConnectionState(SSEConnectionState.CONNECTED);
               setReconnectAttempts(0);
               isFirstChunk = false;
            }

            // 解析 tool_status 事件：工具执行中，展示「正在执行 XXX」避免用户以为卡住
            if (chunk?.event === 'tool_status') {
              try {
                const data = typeof chunk?.data === 'string' ? JSON.parse(chunk.data) : chunk?.data;
                const name = data?.name || data?.tool || '';
                setCurrentToolStatus(name ? t('chat.thinkChain.executingTool', { name }) : t('chat.thinkChain.executingToolGeneric'));
              } catch {
                setCurrentToolStatus(t('chat.thinkChain.executingToolGeneric'));
              }
              return;
            }

            // 收到内容时清除工具状态
            setCurrentToolStatus('');

            // 解析 documents 事件（SSE 格式为 documents: {...}，XStream 解析为 chunk.documents 字符串）
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
            // 兼容可能的字符串类型
            if (typeof chunk === 'string') {
                 data = chunk;
            }

            const payload = typeof data === 'string' ? data.trim() : '';

            // 兜底：部分 SSE 解析器不传 event，tool_status 的 data 会作为普通 data 到达
            // 若 payload 形如 {"tool":"skill","name":"skill(xxx)"} 且无 content/reasoning_content，按 tool_status 处理
            try {
              const parsed = JSON.parse(payload);
              if (parsed && (parsed.tool != null || parsed.name != null) && parsed.content == null && parsed.reasoning_content == null && parsed.delta == null) {
                const name = parsed.name || parsed.tool || '';
                setCurrentToolStatus(name ? t('chat.thinkChain.executingTool', { name }) : t('chat.thinkChain.executingToolGeneric'));
                return;
              }
            } catch {
              /* 非 JSON，继续按 content 处理 */
            }

            if (payload === '[DONE]') {
              // 传输完成
              const finalMsg = accumulatedMessageRef.current.trim();
              const finalReasoning = accumulatedReasoningRef.current.trim();
              if (finalMsg) {
                const aiMessage: Message = {
                  id: Date.now(),
                  msg_id: generateMsgId(),
                  content: finalMsg,
                  isUser: false,
                  timestamp: new Date(),
                  ...(finalReasoning ? { reasoningContent: finalReasoning } : {}),
                };
                setMessages((prev) => [...prev, aiMessage]);
              }
              
              setCurrentAiMessage('');
              setCurrentReasoningContent('');
              setCurrentToolStatus('');
              accumulatedMessageRef.current = '';
              accumulatedReasoningRef.current = '';
              setLoading(false);
              setConnectionState(SSEConnectionState.DISCONNECTED);
              return;
            }

            setCurrentToolStatus('');

            // 解析内容与思考过程
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
            } catch {
              // 非 JSON，当做纯文本
            }

            // 检查内容是否包含 [DONE] 标记，有时它会附在最后一条消息中
            if (contentSegment.includes('[DONE]')) {
                const parts = contentSegment.split('[DONE]');
                contentSegment = parts[0];
                accumulatedMessageRef.current += contentSegment;
                setCurrentAiMessage(accumulatedMessageRef.current);

                // 触发结束逻辑
                const finalMsg = accumulatedMessageRef.current.trim();
                const finalReasoning = accumulatedReasoningRef.current.trim();
                if (finalMsg) {
                  const aiMessage: Message = {
                    id: Date.now(),
                    msg_id: generateMsgId(),
                    content: finalMsg,
                    isUser: false,
                    timestamp: new Date(),
                    ...(finalReasoning ? { reasoningContent: finalReasoning } : {}),
                  };
                  setMessages((prev) => [...prev, aiMessage]);
                }
                
              setCurrentAiMessage('');
              setCurrentReasoningContent('');
              setCurrentToolStatus('');
              accumulatedMessageRef.current = '';
              accumulatedReasoningRef.current = '';
              setLoading(false);
              setConnectionState(SSEConnectionState.DISCONNECTED);
              return;
            }

            accumulatedMessageRef.current += contentSegment;
            setCurrentAiMessage(accumulatedMessageRef.current);
            if (reasoningSegment) {
              accumulatedReasoningRef.current += reasoningSegment;
              setCurrentReasoningContent(accumulatedReasoningRef.current);
            }
          },
          onSuccess: () => {
             // 请求结束，确保状态正确
             setCurrentToolStatus('');
             setLoading(false);
             setConnectionState((prev) => {
                 // 如果当前是错误状态，保留错误状态
                 if (prev === SSEConnectionState.ERROR) return prev;
                 return SSEConnectionState.DISCONNECTED;
             });
          },
          onError: (error: Error) => {
            // token 无效或 401 时自动退出登录
            const errStr = String(error?.message || error || '').toLowerCase();
            if (errStr.includes('401') || (errStr.includes('token') && (errStr.includes('invalid') || errStr.includes('失效') || errStr.includes('过期')))) {
              clearAuthStorage();
            }
            // 检查是否为中断错误
            const isAbort = error.name === 'AbortError';
            
            if (isAbort || isUserStoppedRef.current) {
              if (isUserStoppedRef.current) {
                  setLoading(false);
                  setConnectionState(SSEConnectionState.DISCONNECTED);
              }
              return;
            }

            console.error('SSE Error:', error);
            
            // 如果当前已经是ERROR状态，不需要再重试，直接返回
            if(connectionState === SSEConnectionState.ERROR) {
                 return;
            }

            // 重试逻辑
            if (attempt < MAX_RECONNECT_ATTEMPTS) {
              const nextAttempt = attempt + 1;
              setReconnectAttempts(nextAttempt);
              setConnectionError(t('chat.sse.reconnecting', { attempt: nextAttempt }));
              setConnectionState(SSEConnectionState.RECONNECTING);

              // 延迟重连
              retryTimerRef.current = setTimeout(() => {
                  createConnection(question, sessionId, uploadedFiles, nextAttempt);
              }, 2000);
            } else {
              setConnectionError(t('chat.sse.connectionFailed'));
              setConnectionState(SSEConnectionState.ERROR);
              setLoading(false);
            }
          }
        }
      });

      requestRef.current = request;
      request.run();

    } catch (error: any) {
       console.error('Request creation error:', error);
       setLoading(false);
       setConnectionState(SSEConnectionState.ERROR);
    }
  }, [selectedKnowledge, advancedSettings, isNetworkEnabled, isStudyMode, isDeepThinking, generateMsgId, setMessages, connectionState]);

  // --- 导出方法 ---

  const send = useCallback((text: string, sessionId: string, uploadedFiles: string[] = []) => {
    cleanup();
    isUserStoppedRef.current = false;
    createConnection(text, sessionId, uploadedFiles, 0);
  }, [createConnection, cleanup]);

  const stop = useCallback(() => {
    isUserStoppedRef.current = true;
    
    // 中止请求
    if (requestRef.current) {
      requestRef.current.abort();
    }
    // 清除重连
    if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
    }

    // 保存已生成的内容
    if (accumulatedMessageRef.current.trim()) {
      const finalReasoning = accumulatedReasoningRef.current.trim();
      const aiMessage: Message = {
        id: Date.now(),
        msg_id: generateMsgId(),
        content: accumulatedMessageRef.current.trim(),
        isUser: false,
        timestamp: new Date(),
        ...(finalReasoning ? { reasoningContent: finalReasoning } : {}),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }

    // 重置状态
    setCurrentAiMessage('');
    setCurrentReasoningContent('');
    setCurrentToolStatus('');
    accumulatedReasoningRef.current = '';
    accumulatedMessageRef.current = '';
    setLoading(false);
    setConnectionState(SSEConnectionState.DISCONNECTED);
    setConnectionError(null);
  }, [generateMsgId, setMessages]);


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
