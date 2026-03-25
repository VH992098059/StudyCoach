/**
 * 主聊天页面：包含会话列表、消息展示、输入区、知识库检索、语音交互
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button, Alert, message, Empty } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useChatSessions } from '@/hooks/useChatSessions';
import { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
import type { UploadedFile } from '@/types/chat';
import type { FileUploadRef } from './components/FileUpload';
import { SessionInfoPanel, SessionInfoDrawer, ChatTopBar, BubbleMessageList, useReferences, useScrollHandlers, useChatComposer } from './components';
import ChatSidebar from './components/pc/ChatSidebar';
import SidebarDrawer from './components/mobile/SidebarDrawer';
import useSSEChat, { MAX_RECONNECT_ATTEMPTS } from './components/useSSEChat.tsx';
import useVoiceService from './components/useVoiceService.tsx';
import InputArea from './components/InputArea';
import { useChatSettings } from '@/hooks/useChatSettings';


const AIChat: React.FC = () => {
  const { t } = useTranslation();
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

  const { isScrolling, isMessageScrolling, handleScroll, handleMessageScroll } = useScrollHandlers();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sessionInfoDrawerVisible, setSessionInfoDrawerVisible] = useState(false);

  const {
    selectedKnowledge,
    advancedSettings,
    referenceDocuments,
    showReferences,
    isReferenceScrolling,
    handleKnowledgeChange,
    handleAdvancedSettingsChange,
    handleToggleReferences,
    handleReferenceScroll,
    fetchReferenceDocuments,
    setReferenceDocuments,
    setShowReferences,
  } = useReferences();
  const knowledgeSelectorRef = useRef<KnowledgeSelectorRef>(null);

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
  const { isMobile, isTablet } = useBreakpoints();

  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  // 滚动到底部：用 RAF 代替固定延迟，确保在浏览器绘制后执行
  const rafRef = useRef<number>(0);
  const scrollToBottom = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      }
    });
  }, []);

  // messages 新增 / AI 流式内容更新时滚动；移除 currentReasoningContent 减少不必要触发
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAiMessage, scrollToBottom]);

  const handleStop = () => { stop(); };

  const uploadFilesIfNeeded = useCallback(async (sessionId: string) => {
    return fileUploadRef.current?.uploadFiles(sessionId) ?? [];
  }, []);

  const clearUploadedFiles = useCallback(() => {
    fileUploadRef.current?.clearAllFiles();
    setCurrentUploadedFiles([]);
  }, []);

  const {
    inputValue,
    setInputValue,
    sendQuestionByText,
    handleSend,
  } = useChatComposer({
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
  // 处理文件上传变化
  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setCurrentUploadedFiles(files);
  }, []);

  // 处理文件上传完成
  const handleUploadComplete = useCallback((files: UploadedFile[]) => {
    setCurrentUploadedFiles(files);
  }, []);

  // 切换联网/学习模式/深度思考：由 useChatSettings 提供，已持久化到 localStorage

  const handleCloseDrawer = useCallback(() => setDrawerVisible(false), []);
  const handleOpenSidebar = useCallback(() => setDrawerVisible(true), []);
  const handleCloseSessionInfoDrawer = useCallback(() => setSessionInfoDrawerVisible(false), []);
  const handleOpenInfo = useCallback(() => setSessionInfoDrawerVisible(true), []);

  /** 检测上一条 AI 消息是否为学习计划（含番茄钟、项目启动计划等关键词） */
  const showConfirmSavePlan = useMemo(() => {
    if (streamingLoading || messages.length === 0) return false;
    const last = messages[messages.length - 1];
    if (last.isUser) return false;
    const content = (last.content || '').toString();
    const keywords = ['番茄钟', '项目启动计划', '模版 A', '费曼实战计划', '任务切片', '🍅', 'MVP'];
    return keywords.some((k) => content.includes(k)) && content.length > 80;
  }, [messages, streamingLoading]);

  /** 点击「确认保存计划」：发送固定文案触发后端 save_plan */
  const handleConfirmSavePlan = useCallback(() => {
    sendQuestionByText('我确认采纳这个计划，请保存');
  }, [sendQuestionByText]);

  /** 保存成功提示：当 AI 回复包含「已保存」时显示 Toast */
  const lastToastMsgIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.isUser) return;
    const content = (last.content || '').toString();
    const msgKey = (last.msg_id || last.id) + '';
    if (content.includes('已保存') && lastToastMsgIdRef.current !== msgKey) {
      lastToastMsgIdRef.current = msgKey;
      message.success(t('chat.planSavedSuccess'));
    }
  }, [messages, t]);

  /**
   * 复制文档内容到剪贴板
   */
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('chat.copySuccess'));
    } catch (error) {
      console.error('复制失败:', error);
      message.error(t('chat.copyFailed'));
    }
  }, [t]);

  return (
    <div style={{
      display: 'flex'
    }}>


      {/* 左侧聊天记录面板 - 桌面端 */}
      {!isMobile && (
        <div>
          <ChatSidebar
            isTablet={isTablet}
            chatSessions={chatSessions}
            currentSessionId={currentSessionId}
            isScrolling={isScrolling}
            onScroll={handleScroll}
            onCreateSession={createNewSession}
            onLoadSession={loadSession}
            onDeleteSession={deleteSession}
          />
        </div>
      )}

      <SidebarDrawer
        open={drawerVisible}
        onClose={handleCloseDrawer}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onCreateSession={createNewSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />

      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '16px',
        padding: isMobile ? '12px' : isTablet ? '16px' : '20px'
      }}>
        {/* 聊天区域 */}
        <div style={{
          flex: 1,
          display: 'flex',
          height: '88vh',
          flexDirection: 'column'
        }}>
          <ChatTopBar isMobile={isMobile} onOpenSidebar={handleOpenSidebar} onOpenInfo={handleOpenInfo} />
          {/* 连接错误提示 */}
          {connectionError && (
            <Alert
              title={connectionError}
              type={reconnectAttempts >= MAX_RECONNECT_ATTEMPTS ? 'error' : 'warning'}
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: '16px' }}
              showIcon
              closable={{ onClose: () => setConnectionError(null) }}
            />
          )}

          {chatSessions.length > 0 && currentSessionId ? (
            <>
              <BubbleMessageList
                messages={messages}
                isMobile={isMobile}
                isMessageScrolling={isMessageScrolling}
                onScroll={handleMessageScroll}
                loading={streamingLoading}
                connectionState={connectionState}
                currentAiMessage={currentAiMessage}
                currentReasoningContent={currentReasoningContent}
                messagesEndRef={messagesEndRef}
                documentsCount={documentsCount}
                currentToolStatus={currentToolStatus}
                hasKnowledgeBase={selectedKnowledge !== 'none' && !!selectedKnowledge}
              />

              {/* 输入区域 */}
              <InputArea
                inputValue={inputValue}
                loading={streamingLoading}
                isNetworkEnabled={isNetworkEnabled}
                isStudyMode={isStudyMode}
                isDeepThinking={isDeepThinking}
                currentUploadedFiles={currentUploadedFiles}
                sessionId={currentSessionId}
                fileUploadRef={fileUploadRef}
                showConfirmSavePlan={showConfirmSavePlan}
                onConfirmSavePlan={handleConfirmSavePlan}
                onVoiceTranscript={(text) => sendQuestionByText(text)}
                onInputChange={setInputValue}
                onSend={handleSend}
                onStop={handleStop}
                onToggleNetwork={toggleNetwork}
                onToggleStudyMode={toggleStudyMode}
                onToggleDeepThinking={toggleDeepThinking}
                onFilesChange={handleFilesChange}
                onUploadComplete={handleUploadComplete}
              />
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              height: '85vh'
            }}>
              <Empty description={t('chat.noSession')} image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" onClick={createNewSession}>{t('chat.newSession')}</Button>
              </Empty>
            </div>
          )}

        </div>

        {/* 右侧会话信息面板 - 桌面端和平板端 */}
        {!isMobile && chatSessions.length > 0 && currentSessionId && (
          <div
            style={{
              width: isTablet ? '240px' : '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: isTablet ? 16 : 24,
            }}
          >
            <SessionInfoPanel
              isTablet={isTablet}
              currentSessionId={currentSessionId}
              messagesCount={messages.length}
              selectedKnowledge={selectedKnowledge}
              knowledgeSelectorRef={knowledgeSelectorRef}
              onKnowledgeChange={handleKnowledgeChange}
              isNetworkEnabled={isNetworkEnabled}
              advancedSettings={advancedSettings}
              onAdvancedSettingsChange={handleAdvancedSettingsChange}
              referenceDocuments={referenceDocuments}
              showReferences={showReferences}
              onToggleReferences={handleToggleReferences}
              isReferenceScrolling={isReferenceScrolling}
              onReferenceScroll={handleReferenceScroll}
              onCopyDocumentContent={copyToClipboard}
            />
          </div>
        )}
      </div>

      {/* 移动端会话信息抽屉 */}
      {chatSessions.length > 0 && currentSessionId && (
        <SessionInfoDrawer
          open={sessionInfoDrawerVisible}
          onClose={handleCloseSessionInfoDrawer}
          showReferences={showReferences}
          onToggleReferences={() => setShowReferences(!showReferences)}
          currentSessionId={currentSessionId}
          messagesCount={messages.length}
          selectedKnowledge={selectedKnowledge}
          knowledgeSelectorRef={knowledgeSelectorRef}
          onKnowledgeChange={handleKnowledgeChange}
          isNetworkEnabled={isNetworkEnabled}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={handleAdvancedSettingsChange}
          referenceDocuments={referenceDocuments}
          isReferenceScrolling={isReferenceScrolling}
          onReferenceScroll={handleReferenceScroll}
          onCopyDocumentContent={copyToClipboard}
        />
      )}


    </div>
  );
};

export default AIChat;
