/**
 * 主聊天页（设计文档 4.1：三栏布局）
 * 会话列表 220px ｜ 消息区 flex（工具栏 + 消息流 + 输入区）｜ 参考文档 250px 可收起
 * assistant-ui：useChatRuntime 适配现有 useChatSessions + useSSEChat 状态
 * 业务逻辑层（SSE / 会话 / 引用 / 语音 / 附件）全部沿用
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { Plus, TriangleAlert, X } from 'lucide-react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useChatSettings } from '@/hooks/useChatSettings';
import type { UploadedFile } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import ChatHistoryService from '@/services/chatHistory';

import type { FileUploadRef } from './components/FileUpload';
import { useReferences, useChatComposer, useSSEChat, useVoiceService, MAX_RECONNECT_ATTEMPTS } from './components';
import ChatSidebar from './components/pc/ChatSidebar';
import SessionInfoPanel from './components/pc/SessionInfoPanel';
import ChatTopBar from './components/mobile/ChatTopBar';
import SidebarDrawer from './components/mobile/SidebarDrawer';
import SessionInfoDrawer from './components/mobile/SessionInfoDrawer';
import ChatThread from './components/thread/ChatThread';
import ChatComposer from './components/ChatComposer';
import { UserActionsProvider } from './context/UserActionsContext';
import { useChatRuntime, buildPipelineNodes } from './runtime/useChatRuntime';

const AIChat: React.FC = () => {
  const { t } = useTranslation();

  /** 手机端（<768px）：会话列表与参考文档均走抽屉 */
  const isMobile = useMediaQuery('(max-width: 767px)');
  /** 宽屏（≥1100px）：参考文档为右栏内联面板 */
  const isWide = useMediaQuery('(min-width: 1100px)');

  const {
    currentSessionId,
    chatSessions,
    messages,
    createNewSession,
    loadSession,
    deleteSession,
    setMessages,
    generateMsgId,
  } = useChatSessions();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);

  const {
    selectedKnowledge,
    advancedSettings,
    referenceDocuments,
    showReferences,
    handleKnowledgeChange,
    handleAdvancedSettingsChange,
    handleToggleReferences,
    fetchReferenceDocuments,
    setReferenceDocuments,
    setShowReferences,
  } = useReferences();

  const {
    isNetworkEnabled,
    isStudyMode,
    isDeepThinking,
    toggleStudyMode,
    toggleDeepThinking,
    toggleNetwork,
  } = useChatSettings();

  const {
    connectionState,
    reconnectAttempts,
    connectionError,
    setConnectionError,
    currentAiMessage,
    currentReasoningContent,
    currentToolStatus,
    loading: streamingLoading,
    documentsCount,
    stages,
    send,
    stop,
  } = useSSEChat({
    selectedKnowledge,
    advancedSettings,
    isNetworkEnabled,
    isStudyMode,
    isDeepThinking,
    generateMsgId,
    setMessages,
  });

  const [currentUploadedFiles, setCurrentUploadedFiles] = useState<UploadedFile[]>([]);
  const fileUploadRef = useRef<FileUploadRef | null>(null);

  useVoiceService();

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFilesIfNeeded = useCallback(async (sessionId: string) => {
    return fileUploadRef.current?.uploadFiles(sessionId) ?? [];
  }, []);

  const clearUploadedFiles = useCallback(() => {
    fileUploadRef.current?.clearAllFiles();
    setCurrentUploadedFiles([]);
  }, []);

  const { sendQuestionByText } = useChatComposer({
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
    currentUploadedFiles,
    clearUploadedFiles,
  });

  /** assistant-ui 适配层：发送链路走 useChatComposer（附件上传 + SSE 参数完整保留） */
  const runtime = useChatRuntime({
    messages,
    isRunning: streamingLoading,
    currentAiMessage,
    currentReasoningContent,
    stages,
    onNewMessage: sendQuestionByText,
    onStop: stop,
  });

  /** 最后一条用户消息 ID：仅它显示"重新生成" */
  const lastUserMsgId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].isUser) return messages[i].msg_id || messages[i].id;
    }
    return null;
  }, [messages]);

  /** 复制到剪贴板（消息操作栏 / 参考文档共用） */
  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(t('chat.copySuccess'));
      } catch (error) {
        console.error('复制失败:', error);
        toast.error(t('chat.copyFailed'));
      }
    },
    [t],
  );

  /**
   * 用户消息"编辑重发 / 重新生成"统一链路：
   * 后端截断（DB 删该时间戳及之后 + LLM 历史保留该条之前）→ 本地同步截断 → 重发文本流式生成。
   * newText 为 null/undefined 时表示重发原文（重新生成）。
   */
  const handleTruncateAndSend = useCallback(
    async (msgId: string, newText?: string | null) => {
      if (!currentSessionId || streamingLoading) return;
      const idx = messages.findIndex((m) => (m.msg_id || m.id) === msgId);
      if (idx === -1 || !messages[idx].isUser) return;

      try {
        await ChatHistoryService.truncateMessages({
          session_id: currentSessionId,
          keep_count: idx,
          before_timestamp: new Date(messages[idx].timestamp).getTime(),
        });
      } catch (error) {
        console.error('truncate messages failed:', error);
        toast.error(t('chat.truncateFailed'));
        return;
      }

      const remaining = messages.slice(0, idx);
      setMessages(remaining);

      const text = (newText ?? messages[idx].content).trim();
      if (!text) return;
      await sendQuestionByText(text, { baseMessages: remaining });
    },
    [currentSessionId, streamingLoading, messages, setMessages, sendQuestionByText, t],
  );

  /** 用户消息操作栏上下文（复制 / 编辑 / 重新生成） */
  const userActionsValue = useMemo(
    () => ({
      isRunning: streamingLoading,
      lastUserMsgId,
      onCopy: copyToClipboard,
      onTruncateAndSend: handleTruncateAndSend,
    }),
    [streamingLoading, lastUserMsgId, copyToClipboard, handleTruncateAndSend],
  );

  const hasKnowledgeBase = selectedKnowledge !== 'none' && !!selectedKnowledge;
  const pipelineNodes = useMemo(
    () =>
      buildPipelineNodes(
        {
          stages,
          connectionState,
          documentsCount,
          hasKnowledgeBase,
          hasContent: !!(currentAiMessage || currentReasoningContent),
        },
        t,
      ),
    [stages, connectionState, documentsCount, hasKnowledgeBase, currentAiMessage, currentReasoningContent, t],
  );

  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setCurrentUploadedFiles(files);
  }, []);

  const handleUploadComplete = useCallback((files: UploadedFile[]) => {
    setCurrentUploadedFiles(files);
  }, []);

  /** 参考文档开关：宽屏切换右栏面板；窄屏打开浮层 */
  const handleToggleReferencesPanel = useCallback(() => {
    if (isWide) {
      handleToggleReferences();
    } else {
      setInfoDrawerOpen(true);
    }
  }, [isWide, handleToggleReferences]);

  /** AI 回复包含「已保存」时提示（沿用旧逻辑，antd message → sonner） */
  const lastToastMsgIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.isUser) return;
    const content = (last.content || '').toString();
    const msgKey = (last.msg_id || last.id) + '';
    if (content.includes('已保存') && lastToastMsgIdRef.current !== msgKey) {
      lastToastMsgIdRef.current = msgKey;
      toast.success(t('chat.planSavedSuccess'));
    }
  }, [messages, t]);

  const sessionTitle = useMemo(
    () => chatSessions.find((s) => s.id === currentSessionId)?.title,
    [chatSessions, currentSessionId],
  );

  const hasSession = chatSessions.length > 0 && !!currentSessionId;

  return (
    <div className="flex h-[calc(100vh-var(--header-h))] w-full overflow-hidden">
      {/* 左栏：会话列表（≥768px 常驻） */}
      {!isMobile && (
        <ChatSidebar
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onCreateSession={createNewSession}
          onLoadSession={loadSession}
          onDeleteSession={deleteSession}
        />
      )}

      {/* 移动端会话抽屉 */}
      {isMobile && (
        <SidebarDrawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onCreateSession={createNewSession}
          onLoadSession={loadSession}
          onDeleteSession={deleteSession}
        />
      )}

      {/* 中栏：消息区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatTopBar
          isMobile={isMobile}
          sessionTitle={sessionTitle}
          messagesCount={messages.length}
          referenceCount={referenceDocuments.length}
          showReferences={showReferences && isWide}
          onToggleReferences={handleToggleReferencesPanel}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* 连接错误内联提示条 */}
        {connectionError && (
          <div
            className={cn(
              'mx-4 mt-2 flex items-start gap-2 rounded-md border px-3 py-2 text-xs',
              reconnectAttempts >= MAX_RECONNECT_ATTEMPTS
                ? 'border-danger/40 bg-danger-bg text-danger'
                : 'border-warning/40 bg-warning-bg text-warning',
            )}
            role="alert"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 break-all">{connectionError}</span>
            <button
              type="button"
              className="shrink-0 cursor-pointer opacity-60 hover:opacity-100"
              onClick={() => setConnectionError(null)}
              aria-label={t('common.close')}
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {hasSession ? (
          <AssistantRuntimeProvider runtime={runtime}>
            {/* 消息流：滚动视口 + 消息列表 + （普通模式的独立流水线） */}
            <UserActionsProvider value={userActionsValue}>
              <ChatThread
                isRunning={streamingLoading}
                pipelineNodes={pipelineNodes}
                toolStatus={currentToolStatus}
                stages={stages}
              />
            </UserActionsProvider>

            {/* 输入区：附件 + 知识库 chip + 输入框 + 语音 + 开关行 */}
            <ChatComposer
              isRunning={streamingLoading}
              sessionId={currentSessionId}
              selectedKnowledge={selectedKnowledge}
              onKnowledgeChange={handleKnowledgeChange}
              isNetworkEnabled={isNetworkEnabled}
              isStudyMode={isStudyMode}
              isDeepThinking={isDeepThinking}
              onToggleNetwork={toggleNetwork}
              onToggleStudyMode={toggleStudyMode}
              onToggleDeepThinking={toggleDeepThinking}
              fileUploadRef={fileUploadRef}
              currentUploadedFiles={currentUploadedFiles}
              onFilesChange={handleFilesChange}
              onUploadComplete={handleUploadComplete}
              onVoiceTranscript={(text) => sendQuestionByText(text)}
            />
          </AssistantRuntimeProvider>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title={t('chat.noSession')}
              action={
                <Button onClick={createNewSession} className="gap-1">
                  <Plus className="size-4" />
                  {t('chat.newSession')}
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* 右栏：参考文档面板（≥1100px 且开启时内联展示） */}
      {isWide && showReferences && hasSession && (
        <SessionInfoPanel
          referenceDocuments={referenceDocuments}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={handleAdvancedSettingsChange}
          onCopyDocumentContent={copyToClipboard}
        />
      )}

      {/* 窄屏参考文档浮层 */}
      {(!isWide || isMobile) && (
        <SessionInfoDrawer
          open={infoDrawerOpen}
          onClose={() => setInfoDrawerOpen(false)}
          referenceDocuments={referenceDocuments}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={handleAdvancedSettingsChange}
          onCopyDocumentContent={copyToClipboard}
        />
      )}
    </div>
  );
};

export default AIChat;
