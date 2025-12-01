/**
 * @fileoverview 聊天输入编排 Hook
 * @description 管理输入内容、格式化文本、触发发送；
 * 当选择了知识库时拉取参考文档并控制其展示。
 */
import { useCallback, useState } from 'react';
import type { Message } from '@/types/chat';
import type { ReferenceDocument } from './useReferences';

interface UseChatComposerParams {
  messages: Message[];
  generateMsgId: () => string;
  setMessages: (messages: Message[]) => void;
  currentSessionId: string;
  selectedKnowledge: string;
  fetchReferenceDocuments: (query: string) => Promise<ReferenceDocument[]>;
  setReferenceDocuments: (docs: ReferenceDocument[]) => void;
  setShowReferences: (show: boolean) => void;
  send: (text: string, sessionId: string) => void;
  streamingLoading: boolean;
}

const useChatComposer = (params: UseChatComposerParams) => {
  const {
    messages,
    generateMsgId,
    setMessages,
    currentSessionId,
    selectedKnowledge,
    fetchReferenceDocuments,
    setReferenceDocuments,
    setShowReferences,
    send,
    streamingLoading,
  } = params;

  const [inputValue, setInputValue] = useState('');

  const formatUserInput = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return t;
    const s = t.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
    return s.replace(/\n/g, isTauri ? '<br/>' : '  \n');
  }, []);

  const sendQuestionByText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      msg_id: generateMsgId(),
      content: formatUserInput(text),
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    
    // 立即发送消息，不等待引用检索
    send(text, currentSessionId);

    // 异步获取引用文档
    if (selectedKnowledge !== 'none') {
      // 清空旧的引用
      setReferenceDocuments([]);
      setShowReferences(false);
      
      fetchReferenceDocuments(text)
        .then(references => {
          setReferenceDocuments(references);
          if (references.length > 0) setShowReferences(true);
        })
        .catch(() => {
          // 忽略错误，已经在 fetchReferenceDocuments 中处理了
        });
    } else {
      setReferenceDocuments([]);
      setShowReferences(false);
    }
  }, [messages, selectedKnowledge, fetchReferenceDocuments, setReferenceDocuments, setShowReferences, generateMsgId, setMessages, formatUserInput, send, currentSessionId]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || streamingLoading) return;
    await sendQuestionByText(inputValue);
  }, [inputValue, streamingLoading, sendQuestionByText]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return {
    inputValue,
    setInputValue,
    formatUserInput,
    sendQuestionByText,
    handleSend,
    handleKeyPress,
  };
};

export default useChatComposer;