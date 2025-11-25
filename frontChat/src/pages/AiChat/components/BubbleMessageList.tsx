/**
 * @fileoverview 气泡消息列表
 * @description 使用 Ant Design X 的 Bubble 渲染用户/AI 气泡消息，
 * 支持移动端样式、连接状态指示与实时回复展示。
 */
import React from 'react';
import { Card, Typography } from 'antd';
import { Bubble } from '@ant-design/x';
import type { BubbleProps } from '@ant-design/x';
import MarkdownIt from 'markdown-it';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import type { Message } from '@/types/chat';
import { SSEConnectionState } from '@/utils/sse/sse';
const md = new MarkdownIt({ html: true, breaks: true });
const sanitizeMarkdown = (text: string): string => {
  if (!text) return '';
  const base = text.replace(/```markdown/g, '```').replace(/^[\s\n]+/, '');
  const parts = base.split(/(```[\s\S]*?```)/g);
  const normalized = parts
    .map((seg) => {
      if (seg.startsWith('```')) return seg;
      return seg
        .replace(/\*\*\s+([^*][^\n]*?)\s+\*\*/g, '**$1**')
        .replace(/\*\s+([^*][^\n]*?)\s+\*/g, '*$1*')
        .replace(/__\s+([^_][^\n]*?)\s+__/g, '__$1__')
        .replace(/_\s+([^_][^\n]*?)\s+_/g, '_$1_')
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '  \n');
    })
    .join('');
  return normalized;
};

const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  const raw = typeof content === 'string' ? content : String(content ?? '');
  const html = md.render(sanitizeMarkdown(raw));
  return (
    <Typography>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Typography>
  );
};
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
      styles={{body:{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}}
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
              content: m.content,
            })),
            ...(loading || currentAiMessage
              ? [
                  {
                    role: 'assistant',
                    placement: 'start' as 'start' | 'end',
                    avatar: { icon: <RobotOutlined />, style: aiAvatarStyle },
                    typing: !currentAiMessage,
                    content: currentAiMessage || '正在连接AI服务...',
                    styles: !currentAiMessage ? { avatar: hideAvatar } : undefined,
                  },
                ]
              : []),
          ]}
          roles={{
            user: { messageRender: renderMarkdown, styles: { content: { padding: '2px 9px', borderRadius: 17 } } },
            assistant: { messageRender: renderMarkdown, styles: { content: { padding: '2px 9px', borderRadius: 17 } } },
          }}
        />

        <div ref={messagesEndRef} />
      </div>
    </Card>
  );
};

export default BubbleMessageList;