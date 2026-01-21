/**
 * @fileoverview 气泡消息列表
 * @description 使用 Ant Design X 的 Bubble 渲染用户/AI 气泡消息，
 * 支持移动端样式、连接状态指示与实时回复展示。
 */
import React from 'react';
import { Card, Avatar } from 'antd';
import { Bubble, XProvider } from '@ant-design/x';
import zhCN from '@ant-design/x/locale/zh_CN';
import enUS from '@ant-design/x/locale/en_US';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import HighlightCode from '@ant-design/x-markdown/plugins/HighlightCode';
import Latex from '@ant-design/x-markdown/plugins/Latex';
import Mermaid from '@ant-design/x-markdown/plugins/Mermaid';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Message } from '@/types/chat';
import { SSEConnectionState } from '@/utils/sse/sse';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';
import './BubbleMessageList.css';
import ConnectionStatus from './ConnectionStatus';

const Code: React.FC<ComponentProps> = (props) => {
  const { className, children } = props;
  const lang = className?.match(/language-(\w+)/)?.[1] || '';

  if (typeof children !== 'string') return null;
  if (lang === 'mermaid') {
    return <Mermaid>{children}</Mermaid>;
  }
  return <HighlightCode lang={lang}>{children}</HighlightCode>;
};

const renderMarkdown = (content: React.ReactNode) => {
  const text = typeof content === 'string' ? content : String(content);
  return (
    <XMarkdown 
      components={{ code: Code }}
      config={{ extensions: Latex() }}
      streaming={{ enableAnimation: true, animationConfig: { fadeDuration: 400 } }}
    >
      {text}
    </XMarkdown>
  );
};

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
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? enUS : zhCN;

  return (
    <XProvider locale={locale}>
      <Card
        style={{ flex: 1, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}
        styles={{body:{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}}
      >
        <div
          style={{ flex: 1, padding: isMobile ? 12 : 16, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: isMessageScrolling ? '#d4d4d4 transparent' : 'transparent transparent', minHeight: 0, maxHeight: '100%' }}
          className={`custom-scrollbar ${isMessageScrolling ? 'scrolling' : ''}`}
          onScroll={onScroll}
          ref={messagesEndRef}
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
                key: m.msg_id || m.id,
                role: m.isUser ? 'user' : 'assistant',
                placement: (m.isUser ? 'end' : 'start') as 'end' | 'start',
                avatar: m.isUser
                  ? <Avatar icon={<UserOutlined />} style={userAvatarStyle} />
                  : <Avatar icon={<RobotOutlined />} style={aiAvatarStyle} />,
                content: m.content,
              })),
              ...(loading || currentAiMessage
                ? [
                    {
                      key: 'loading-message',
                      role: 'assistant',
                      placement: 'start' as 'start' | 'end',
                      avatar: <Avatar icon={<RobotOutlined />} style={aiAvatarStyle} />,
                      typing: !currentAiMessage,
                      content: currentAiMessage || t('chat.connecting'),
                      styles: !currentAiMessage ? { avatar: hideAvatar } : undefined,
                    },
                  ]
                : []),
            ]}
            role={{
              user: { contentRender: renderMarkdown, styles: { content: { borderRadius: 17 } } },
              assistant: { contentRender: renderMarkdown, styles: { content: {borderRadius: 17 } } },
            }}
          />
        </div>
      </Card>
    </XProvider>
  );
};

export default BubbleMessageList;