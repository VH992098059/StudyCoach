import React from 'react';
import { Card } from 'antd';
import { Bubble } from '@ant-design/x';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import type { Message } from '../../../types/chat';
import { SSEConnectionState } from '../../../utils/sse/sse';
import MarkdownRenderer from './MarkdownRenderer';
import ConnectionStatus from './ConnectionStatus';

interface VoiceStateProps {
  isReading: boolean;
  currentReadingMsgId: string | null;
  isLoading: boolean;
  loadingMsgId: string | null;
}

interface BubbleMessageListProps {
  messages: Message[];
  isMobile: boolean;
  isMessageScrolling: boolean;
  onScroll: () => void;
  loading: boolean;
  connectionState: SSEConnectionState;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  currentAiMessage: string;
  voiceState: VoiceStateProps;
  messagesEndRef: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
}

const hideAvatar = { display: 'none' } as React.CSSProperties;
const userAvatarStyle = { backgroundColor: '#667eea', color: '#fff' } as React.CSSProperties;
const aiAvatarStyle = { backgroundColor: '#1890ff', color: '#fff' } as React.CSSProperties;

const BubbleMessageList: React.FC<BubbleMessageListProps> = ({
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
  messagesEndRef,
}) => {
  return (
    <Card
      style={{ flex: 1, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <div
        style={{ flex: 1, padding: isMobile ? 12 : 16, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: isMessageScrolling ? '#d4d4d4 transparent' : 'transparent transparent', minHeight: 0, maxHeight: '100%' }}
        className={`custom-scrollbar ${isMessageScrolling ? 'scrolling' : ''}`}
        onScroll={onScroll}
      >
        <ConnectionStatus
          loading={loading}
          connectionState={connectionState}
          reconnectAttempts={reconnectAttempts}
          maxReconnectAttempts={maxReconnectAttempts}
        />

        <Bubble.List
          items={[
            ...messages.map((m) => ({
              role: m.isUser ? 'user' : 'assistant',
              placement: (m.isUser ? 'end' : 'start') as 'end' | 'start',
              avatar: m.isUser
                ? { icon: <UserOutlined />, style: userAvatarStyle }
                : { icon: <RobotOutlined />, style: aiAvatarStyle },
              content: (
                <MarkdownRenderer content={m.content} fontSize={isMobile ? 12 : 13} isUser={m.isUser} />
              ),
            })),
            ...(loading
              ? [
                  {
                    role: 'assistant',
                    placement: 'start' as 'start' | 'end',
                    avatar: { icon: <RobotOutlined />, style: aiAvatarStyle },
                    typing: true,
                    content: (
                      <MarkdownRenderer
                        content={currentAiMessage || '正在连接AI服务...'}
                        fontSize={isMobile ? 12 : 13}
                        isUser={false}
                      />
                    ),
                    styles: !currentAiMessage ? { avatar: hideAvatar } : undefined,
                  },
                ]
              : []),
          ]}
          roles={{
            user: { styles: { content: { padding: '2px 9px', borderRadius: 17 } } },
            assistant: { styles: { content: { padding: '2px 9px', borderRadius: 17 } } },
          }}
        />

        <div ref={messagesEndRef} />
      </div>
    </Card>
  );
};

export default BubbleMessageList;