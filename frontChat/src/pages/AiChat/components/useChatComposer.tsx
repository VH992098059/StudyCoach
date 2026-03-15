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
  send: (text: string, sessionId: string, uploadedFiles?: string[]) => void;
  streamingLoading: boolean;
  /** 上传文件并返回服务端文件名列表，发送前若有附件则调用 */
  uploadFilesIfNeeded?: (sessionId: string) => Promise<string[]>;
  /** 当前已选文件（含 pending/success），用于发送前判断是否需要上传及生成图片预览 */
  currentUploadedFiles?: { file: File; id: string }[];
  /** 发送成功后清空附件列表 */
  clearUploadedFiles?: () => void;
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
    uploadFilesIfNeeded,
    currentUploadedFiles = [],
    clearUploadedFiles,
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
    const trimmed = text.trim();
    if (!trimmed && currentUploadedFiles.length === 0) return;
    const questionText = trimmed || '请查看我上传的文件';

    // 为图片文件生成预览 URL，用于在消息气泡中展示
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const attachments = currentUploadedFiles
      .filter((f) => imageTypes.includes(f.file.type))
      .map((f) => ({ type: 'image' as const, url: URL.createObjectURL(f.file) }));

    const userMessage: Message = {
      id: Date.now(),
      msg_id: generateMsgId(),
      content: formatUserInput(questionText),
      isUser: true,
      timestamp: new Date(),
      ...(attachments.length > 0 ? { attachments } : {}),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    
    // 若有附件，先上传再发送
    let fileNames: string[] = [];
    if (currentUploadedFiles.length > 0 && uploadFilesIfNeeded) {
      fileNames = await uploadFilesIfNeeded(currentSessionId);
    }
    send(questionText, currentSessionId, fileNames);
    clearUploadedFiles?.();

    // 异步获取引用文档
    if (selectedKnowledge !== 'none' && questionText) {
      // 清空旧的引用
      setReferenceDocuments([]);
      setShowReferences(false);
      
      fetchReferenceDocuments(questionText)
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
  }, [messages, selectedKnowledge, fetchReferenceDocuments, setReferenceDocuments, setShowReferences, generateMsgId, setMessages, formatUserInput, send, currentSessionId, currentUploadedFiles, uploadFilesIfNeeded, clearUploadedFiles]);

  const handleSend = useCallback(async () => {
    if ((!inputValue.trim() && currentUploadedFiles.length === 0) || streamingLoading) return;
    await sendQuestionByText(inputValue.trim() || '');
  }, [inputValue, streamingLoading, sendQuestionByText, currentUploadedFiles.length]);

  return {
    inputValue,
    setInputValue,
    formatUserInput,
    sendQuestionByText,
    handleSend,
  };
};

export default useChatComposer;