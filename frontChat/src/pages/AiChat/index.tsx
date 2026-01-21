/**
 * @fileoverview AIChat 页面入口
 * @description 负责整体聊天页面的布局与状态管理，连接各组件与 Hooks。
 * - 布局：侧边栏、消息列表、输入区、信息面板/抽屉
 * - 状态：会话列表与当前会话、SSE连接、文件上传、语音朗读、知识库选择
 * - 交互：发送消息、停止生成、滚动行为、打开/关闭抽屉与高级设置
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button, Alert, message, Empty } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBreakpoints } from '@/hooks/useMediaQuery';
import { useChatSessions } from '@/hooks/useChatSessions';
// import './scrollbar.scss';
import { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
import type { UploadedFile } from '@/types/chat';
import { SessionInfoPanel, SessionInfoDrawer, ChatTopBar, BubbleMessageList, useReferences, useScrollHandlers, useChatComposer } from './components';
import ChatSidebar from './components/pc/ChatSidebar';
import SidebarDrawer from './components/mobile/SidebarDrawer';
import useSSEChat from './components/useSSEChat.tsx';
import useVoiceService from './components/useVoiceService.tsx';
import InputArea from './components/InputArea';


const AIChat: React.FC = () => {
  const { t } = useTranslation();
  // 使用聊天会话管理Hook
  const {
    currentSessionId,
    chatSessions,
    messages,
    createNewSession,
    loadSession,
    deleteSession,
    updateCurrentSession,
    setMessages,
    generateMsgId,
  } = useChatSessions();


  const { isScrolling, isMessageScrolling, handleScroll, handleMessageScroll } = useScrollHandlers();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sessionInfoDrawerVisible, setSessionInfoDrawerVisible] = useState(false);

  // 新增状态
  const {
    selectedKnowledge,
    advancedSettings,
    referenceDocuments,
    showReferences,
    isReferenceScrolling,
    handleKnowledgeChange,
    handleAdvancedSettingsChange,
    handleReferenceScroll,
    fetchReferenceDocuments,
    setReferenceDocuments,
    setShowReferences,
  } = useReferences();
  const knowledgeSelectorRef = useRef<KnowledgeSelectorRef>(null);

  // 联网功能状态
  const [isNetworkEnabled, setIsNetworkEnabled] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  // SSE 连接相关状态
  const {
    connectionState,
    reconnectAttempts,
    connectionError,
    setConnectionError,
    currentAiMessage,
    loading: streamingLoading,
    send,
    stop,
  } = useSSEChat({
    selectedKnowledge,
    advancedSettings,
    isNetworkEnabled,
    isStudyMode,
    generateMsgId,
    setMessages,
  });

  // 文件上传相关状态
  const [currentUploadedFiles, setCurrentUploadedFiles] = useState<UploadedFile[]>([]);

  // 朗读功能相关状态 - 使用语音服务
  const { voiceState } = useVoiceService();

  // 响应式断点
  const { isMobile, isTablet } = useBreakpoints();

  const messagesEndRef = useRef<HTMLDivElement>(null);


  // 常量配置
  const MAX_RECONNECT_ATTEMPTS = 3;

  // 更新会话消息
  useEffect(() => {
    if (currentSessionId && messages.length > 1) {
      updateCurrentSession(messages);
    }
  }, [messages, currentSessionId, updateCurrentSession]);

  // 清理资源
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  // 聊天记录滚动事件处理
  const scrollToBottom = () => {
    // 使用 setTimeout 确保在 DOM 更新后执行滚动
    // 直接操作容器的 scrollTop 属性，确保滚动到底部
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAiMessage]);

  // 发送消息
  const handleStop = () => { stop(); };

  const {
    inputValue,
    setInputValue,
    sendQuestionByText,
    handleSend,
    handleKeyPress,
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
  });
  // 处理文件上传变化
  const handleFilesChange = (files: UploadedFile[]) => {
    setCurrentUploadedFiles(files);
  };

  // 处理文件上传完成
  const handleUploadComplete = (files: UploadedFile[]) => {
    console.log('文件上传完成:', files);
    // 这里可以添加上传完成后的处理逻辑
  };

  /**
   * 切换联网状态
   * @description 切换联网搜索功能的开启/关闭
   */
  const handleToggleNetwork = () => {
    setIsNetworkEnabled(prev => !prev);
    // 移除 message 提示，避免与 UI 状态切换冲突或冗余
    // message.success(isNetworkEnabled ? t('chat.networkDisabled') : t('chat.networkEnabled'));
  };

  /**
   * 切换深度学习模式
   * @description 切换深度学习模式的开启/关闭
   */
  const handleToggleStudyMode = () => {
    setIsStudyMode(prev => !prev);
    // 移除 message 提示
    // message.success(isStudyMode ? t('chat.studyModeDisabled') : t('chat.studyModeEnabled'));
  };

  /**
   * 复制文档内容到剪贴板
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('chat.copySuccess'));
    } catch (error) {
      console.error('复制失败:', error);
      message.error(t('chat.copyFailed'));
    }
  };

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
        onClose={() => setDrawerVisible(false)}
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
          <ChatTopBar isMobile={isMobile} onOpenSidebar={() => setDrawerVisible(true)} onOpenInfo={() => setSessionInfoDrawerVisible(true)} />
          {/* 连接错误提示 */}
          {connectionError && (
            <Alert
              title={connectionError}
              type={reconnectAttempts >= MAX_RECONNECT_ATTEMPTS ? 'error' : 'warning'}
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: '16px' }}
              showIcon
              closable={{onClose:() => setConnectionError(null)}}
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
                reconnectAttempts={reconnectAttempts}
                maxReconnectAttempts={MAX_RECONNECT_ATTEMPTS}
                currentAiMessage={currentAiMessage}
                voiceState={voiceState}
                messagesEndRef={messagesEndRef}
              />

              {/* 输入区域 */}
              <InputArea
                inputValue={inputValue}
                loading={streamingLoading}
                isNetworkEnabled={isNetworkEnabled}
                isStudyMode={isStudyMode}
                currentUploadedFiles={currentUploadedFiles}
                onVoiceTranscript={(text) => sendQuestionByText(text)}
                onInputChange={setInputValue}
                onKeyPress={handleKeyPress}
                onSend={handleSend}
                onStop={handleStop}
                onToggleNetwork={handleToggleNetwork}
                onToggleStudyMode={handleToggleStudyMode}
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
              onToggleReferences={() => setShowReferences(!showReferences)}
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
          onClose={() => setSessionInfoDrawerVisible(false)}
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
