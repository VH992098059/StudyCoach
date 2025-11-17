import { useRef, useState } from 'react';
import { SSEClient, SSEConnectionState } from '../../../utils/sse/sse';
import type { Message } from '../../../types/chat';

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

  const [sseClient, setSseClient] = useState<SSEClient | null>(null);
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(SSEConnectionState.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentAiMessage, setCurrentAiMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedMessageRef = useRef<string>('');
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 3;
  const CONNECTION_TIMEOUT = 60000;

  const cleanup = () => {
    if (sseClient) {
      sseClient.disconnect();
      setSseClient(null);
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    setConnectionState(SSEConnectionState.DISCONNECTED);
  };

  const createConnection = (question: string, sessionId: string, currentAttempt = 0) => {
    if (currentAttempt === 0) {
      cleanup();
      setReconnectAttempts(0);
    }

    setConnectionError(null);
    setCurrentAiMessage('');

    const endpoint = process.env.NODE_ENV === 'production' ? '' : '/chat';
    const client = new SSEClient(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        id: sessionId,
        question,
        knowledge_name: selectedKnowledge === 'none' ? '' : selectedKnowledge,
        top_k: advancedSettings.topK,
        score: advancedSettings.score,
        is_network: isNetworkEnabled,
      }),
      headers: { 'Content-Type': 'application/json' },
      autoReconnect: false,
      timeout: CONNECTION_TIMEOUT,
    });

    client.addEventListener('open', () => {
      setConnectionState(SSEConnectionState.CONNECTED);
      setReconnectAttempts(0);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    });

    accumulatedMessageRef.current = '';
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    client.addEventListener('message', (data) => {
      if (data.data === '[DONE]') {
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
      } else {
        accumulatedMessageRef.current += data.data;
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }
        updateTimerRef.current = setTimeout(() => {
          setCurrentAiMessage(accumulatedMessageRef.current);
        }, 32);
      }
    });

    client.addEventListener('error', (data) => {
      setConnectionState(SSEConnectionState.ERROR);
      if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
        const nextAttempt = currentAttempt + 1;
        setReconnectAttempts(nextAttempt);
        setConnectionError(`连接失败，正在尝试第 ${nextAttempt} 次重连...`);
        setTimeout(() => {
          createConnection(question, sessionId, nextAttempt);
        }, 2000);
      } else {
        setConnectionError('连接失败，已达到最大重连次数，请稍后重试');
        setLoading(false);
        cleanup();
      }
    });

    client.addEventListener('stateChange', (data) => {
      setConnectionState(data.data.newState);
    });

    connectionTimeoutRef.current = setTimeout(() => {
      if (client.getConnectionState() === SSEConnectionState.CONNECTING) {
        setConnectionError('连接超时');
        client.disconnect();
        if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
          const nextAttempt = currentAttempt + 1;
          setReconnectAttempts(nextAttempt);
          setConnectionError(`连接超时，正在尝试第 ${nextAttempt} 次重连...`);
          setTimeout(() => {
            createConnection(question, sessionId, nextAttempt);
          }, 2000);
        } else {
          setConnectionError('连接超时，已达到最大重连次数');
          setLoading(false);
          cleanup();
        }
      }
    }, CONNECTION_TIMEOUT);

    setSseClient(client);
    client.connect();
  };

  const send = (text: string, sessionId: string) => {
    setLoading(true);
    setReconnectAttempts(0);
    setConnectionError(null);
    createConnection(text, sessionId, 0);
  };

  const stop = () => {
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