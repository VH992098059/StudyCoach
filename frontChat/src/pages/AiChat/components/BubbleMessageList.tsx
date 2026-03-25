/**
 * @fileoverview 气泡消息列表
 * @description 使用 Ant Design X 的 Bubble 渲染用户/AI 气泡消息，
 * 支持移动端样式、连接状态指示、思维链展示与实时回复。
 */
import React, { useMemo, useState } from 'react';
import { Card, Avatar, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Bubble, XProvider, ThoughtChain } from '@ant-design/x';
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
import type { ThoughtChainItemType } from '@ant-design/x';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';
import './BubbleMessageList.css';

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

/** AI 消息内容：主内容 + 可展开的思考过程 */
const AssistantMessageContent: React.FC<{
  content: string;
  reasoningContent?: string;
  renderMarkdown: (c: React.ReactNode) => React.ReactNode;
  t: (key: string) => string;
}> = ({ content, reasoningContent, renderMarkdown, t }) => {
  const [expanded, setExpanded] = useState(false);
  if (!reasoningContent) {
    return <>{renderMarkdown(content)}</>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {renderMarkdown(content)}
      <div style={{ marginTop: 4 }}>
        <Button
          type="text"
          size="small"
          icon={expanded ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setExpanded((e) => !e)}
          style={{ color: '#8c8c8c', fontSize: 12, padding: '0 4px', height: 24 }}
        >
          {expanded ? t('chat.thinkChain.hideThinking') : t('chat.thinkChain.viewThinking')}
        </Button>
        {expanded && (
          <div
            style={{
              marginTop: 8,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.06)',
              fontSize: 13,
              color: '#666',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>💭</span>
              {t('chat.thinkChain.thinking')}
            </div>
            {reasoningContent}
          </div>
        )}
      </div>
    </div>
  );
};

interface BubbleMessageListProps {
  messages: Message[];
  isMobile: boolean;
  isMessageScrolling: boolean;
  onScroll: () => void;
  loading: boolean;
  connectionState: SSEConnectionState;
  currentAiMessage: string;
  currentReasoningContent?: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  documentsCount?: number;
  hasKnowledgeBase?: boolean;
  currentToolStatus?: string;
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
  currentAiMessage,
  currentReasoningContent = '',
  messagesEndRef,
  documentsCount = 0,
  hasKnowledgeBase = false,
  currentToolStatus = '',
}) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? enUS : zhCN;

  const thoughtChainItems = useMemo<ThoughtChainItemType[]>(() => {
    const connecting = connectionState === SSEConnectionState.CONNECTING || connectionState === SSEConnectionState.RECONNECTING;
    const connected  = connectionState === SSEConnectionState.CONNECTED;
    const hasContent = currentAiMessage.length > 0;

    const items: ThoughtChainItemType[] = [];
    items.push({
      key: 'connecting',
      title: t('chat.thinkChain.connecting'),
      status: connecting ? 'loading' : 'success',
      blink: connecting,
    });
    if (hasKnowledgeBase) {
      items.push({
        key: 'retrieving',
        title: documentsCount > 0
          ? t('chat.thinkChain.retrieved', { count: documentsCount })
          : t('chat.thinkChain.retrieving'),
        status: documentsCount > 0 ? 'success' : (connected ? 'loading' : undefined),
        blink: connected && documentsCount === 0,
      });
    }
    if (currentToolStatus) {
      items.push({
        key: 'tool',
        title: currentToolStatus,
        status: 'loading',
        blink: true,
      });
    }
    const isGeneratingPhase = connected && (loading || hasContent);
    items.push({
      key: 'generating',
      title: t('chat.thinkChain.generating'),
      status: isGeneratingPhase ? 'loading' : undefined,
      blink: isGeneratingPhase,
    });
    return items;
  }, [connectionState, currentAiMessage, documentsCount, hasKnowledgeBase, currentToolStatus, loading, t]);

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
          <Bubble.List
            items={[
              ...messages.map((m) => ({
                key: m.msg_id || m.id,
                role: m.isUser ? 'user' : 'assistant',
                placement: (m.isUser ? 'end' : 'start') as 'end' | 'start',
                avatar: m.isUser
                  ? <Avatar icon={<UserOutlined />} style={userAvatarStyle} />
                  : <Avatar icon={<RobotOutlined />} style={aiAvatarStyle} />,
                content: m.isUser
                  ? (m.attachments?.length
                      ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {m.attachments
                              .filter((a) => a.type === 'image')
                              .map((a, i) => (
                                <img
                                  key={i}
                                  src={a.url}
                                  alt=""
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: 280,
                                    borderRadius: 8,
                                    objectFit: 'contain',
                                  }}
                                />
                              ))}
                            {m.attachments
                              .filter((a) => a.type !== 'image')
                              .map((a, i) => (
                                <div
                                  key={`file-${i}`}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                  }}
                                >
                                  <span>📎</span>
                                  <span style={{ color: 'inherit' }}>{a.name || 'File'}</span>
                                </div>
                              ))}
                            {m.content && renderMarkdown(m.content)}
                          </div>
                        )
                      : m.content)
                  : m.reasoningContent
                    ? <AssistantMessageContent content={m.content} reasoningContent={m.reasoningContent} renderMarkdown={renderMarkdown} t={t} />
                    : m.content,
              })),
              ...(loading && thoughtChainItems.length > 0 && !currentAiMessage
                ? [
                    {
                      key: 'loading-thought-chain',
                      role: 'assistant',
                      placement: 'start' as 'start' | 'end',
                      avatar: <Avatar icon={<RobotOutlined />} style={aiAvatarStyle} />,
                      content: <ThoughtChain items={thoughtChainItems} line="solid" />,
                    },
                  ]
                : []),
              ...(currentReasoningContent && loading
                ? [
                    {
                      key: 'reasoning-content',
                      role: 'assistant',
                      placement: 'start' as 'start' | 'end',
                      avatar: <Avatar icon={<RobotOutlined />} style={aiAvatarStyle} />,
                      content: (
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            maxWidth: '100%',
                          }}
                        >
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>💭</span>
                            {t('chat.thinkChain.thinking')}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {currentReasoningContent}
                          </div>
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(currentAiMessage || (loading && thoughtChainItems.length === 0)
                ? [
                    {
                      key: 'loading-message',
                      role: 'assistant',
                      placement: 'start' as 'start' | 'end',
                      avatar: <Avatar icon={<RobotOutlined />} style={aiAvatarStyle} />,
                      typing: loading && !currentAiMessage,
                      content: currentAiMessage || t('chat.thinkChain.generating'),
                      styles: loading && !currentAiMessage ? { avatar: hideAvatar } : undefined,
                    },
                  ]
                : []),
            ]}
            role={{
              user: {
                contentRender: (c: React.ReactNode) =>
                  React.isValidElement(c) ? c : renderMarkdown(c),
                styles: { content: { borderRadius: 17 } },
              },
              assistant: {
                contentRender: (content: React.ReactNode) =>
                  typeof content === 'string' ? renderMarkdown(content) : content,
                styles: { content: { borderRadius: 17 } },
              },
            }}
          />
        </div>
      </Card>
    </XProvider>
  );
};

export default React.memo(BubbleMessageList);