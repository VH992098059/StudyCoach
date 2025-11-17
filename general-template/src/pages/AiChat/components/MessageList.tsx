import React from 'react';
import { Card, Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import type { Message } from '../../../types/chat';
import { SSEConnectionState } from '../../../utils/sse/sse';
import MarkdownRenderer from './MarkdownRenderer';
import MessageItem from './MessageItem';
import ConnectionStatus from './ConnectionStatus';
import { defaultCopyAiMessage } from './MessageActions';

export interface MessageListProps {
  messages: Message[];
  isMobile: boolean;
  isMessageScrolling: boolean;
  onScroll: () => void;
  loading: boolean;
  connectionState: SSEConnectionState;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  currentAiMessage: string;
  voiceState: {
    isReading: boolean;
    currentReadingMsgId: string | null;
    isLoading: boolean;
    loadingMsgId: string | null;
  };
  onMessageClick: (msgId: string) => void;
  onReadMessage: (msgId: string, content: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isMobile,
  isMessageScrolling,
  onScroll,
  loading,
  connectionState,
  reconnectAttempts,
  maxReconnectAttempts,
  currentAiMessage,
  voiceState,
  onMessageClick,
  onReadMessage,
  messagesEndRef,
}) => {
  return (
    <Card 
      style={{ 
        flex: 1, 
        marginBottom: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
      styles={{
        body: {
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }
      }}
    >
      <div 
        style={{ 
          flex: 1,
          padding: isMobile ? '12px' : '16px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: isMessageScrolling ? '#d4d4d4 transparent' : 'transparent transparent',
          minHeight: 0,
        }}
        className={`custom-scrollbar ${isMessageScrolling ? 'scrolling' : ''}`}
        onScroll={onScroll}
      >
        {/* 连接状态指示器 */}
        <ConnectionStatus
          loading={loading}
          connectionState={connectionState}
          reconnectAttempts={reconnectAttempts}
          maxReconnectAttempts={maxReconnectAttempts}
        />
        
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isMobile={isMobile}
            isReading={voiceState.isReading}
            currentReadingMsgId={voiceState.currentReadingMsgId}
            isLoading={voiceState.isLoading}
            loadingMsgId={voiceState.loadingMsgId}
            onMessageClick={onMessageClick}
            onCopyMessage={defaultCopyAiMessage}
            onReadMessage={onReadMessage}
          />
        ))}
        
        {/* 实时显示AI回复 */}
        {loading && currentAiMessage && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: isMobile ? '6px' : '8px',
            }}>
              <Avatar 
                icon={<RobotOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{
                maxWidth: isMobile ? '85%' : '70%',
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: isMobile ? '8px' : '12px',
                backgroundColor: '#ffffff',
                wordBreak: 'break-word',
                overflowX: 'auto',
                fontSize: isMobile ? '12px' : '13px',
                border: '2px solid rgb(6, 6, 7)',
                position: 'relative'
              }}>
                <MarkdownRenderer
                  content={currentAiMessage}
                  fontSize={isMobile ? 12 : 13}
                  isUser={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* 列表底部锚点 */}
        <div ref={messagesEndRef} />
      </div>
    </Card>
  );
};

export default MessageList;