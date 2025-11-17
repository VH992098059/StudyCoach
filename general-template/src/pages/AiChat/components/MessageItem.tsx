/**
 * 消息项组件
 * 处理单条聊天消息的完整渲染，包括头像、内容、时间戳和操作按钮
 */

import React from 'react';
import { Avatar } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import type { Message } from '../../../types/chat';
import MarkdownRenderer from './MarkdownRenderer';
import MessageActions from './MessageActions';

interface MessageItemProps {
  /** 消息对象 */
  message: Message;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 是否为平板端 */
  isTablet?: boolean;
  /** 是否选中 */
  isSelected?: boolean;
  /** 是否正在朗读 */
  isReading?: boolean;
  /** 当前朗读的消息ID */
  currentReadingMsgId?: string | null;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 当前加载的消息ID */
  loadingMsgId?: string | null;
  /** 点击消息回调 */
  onMessageClick?: (msgId: string) => void;
  /** 复制消息回调 */
  onCopyMessage?: (content: string) => Promise<void>;
  /** 朗读消息回调 */
  onReadMessage?: (msgId: string, content: string) => void;
}

/**
 * 消息项组件
 */
const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMobile = false,
  isTablet = false,
  isSelected = false,
  isReading = false,
  currentReadingMsgId = null,
  isLoading = false,
  loadingMsgId = null,
  onMessageClick,
  onCopyMessage,
  onReadMessage
}) => {
  const handleClick = () => {
    if (onMessageClick) {
      onMessageClick(message.msg_id);
    }
  };

  const messageStyle = {
    display: 'flex',
    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
    alignItems: 'flex-start',
    marginBottom: isMobile ? '12px' : '16px',
    gap: isMobile ? '8px' : '12px'
  };

  const contentStyle = {
    maxWidth: isMobile ? '85%' : '70%',
    padding: isMobile ? '10px 12px' : '12px 14px',
    borderRadius: isMobile ? '8px' : '12px',
    backgroundColor: message.isUser ? '#e6f7ff' : '#f6f6f6',
    wordBreak: 'break-word' as const,
    overflowX: 'auto' as const,
    fontSize: isMobile ? '12px' : '13px',
    cursor: 'pointer',
    border: isSelected ? '2px solid #1890ff' : '2px solid transparent',
    transition: 'all 0.2s ease'
  };

  const timestampStyle = {
    display: 'flex',
    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
    alignItems: 'center',
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
    marginLeft: message.isUser ? '0' : (isMobile ? '40px' : '48px'),
    marginRight: message.isUser ? (isMobile ? '40px' : '48px') : '0',
    gap: '8px'
  };

  return (
    <div>
      {/* 消息内容 */}
      <div style={messageStyle}>
        {!message.isUser && (
          <Avatar 
            icon={<RobotOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
        )}
        <div
          style={contentStyle}
          onClick={handleClick}
        >
          <MarkdownRenderer
            content={message.content}
            isUser={message.isUser}
            fontSize={isMobile ? 12 : 13}
          />
        </div>
        {message.isUser && (
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#52c41a' }}
          />
        )}
      </div>

      {/* 时间戳和操作按钮 */}
      <div style={timestampStyle}>
        <span>{message.timestamp.toLocaleTimeString()}</span>
        
        {/* AI消息功能按钮 */}
        {!message.isUser && (
          <MessageActions
            content={message.content}
            messageId={message.msg_id}
            isMobile={isMobile}
            isReading={isReading}
            currentReadingMsgId={currentReadingMsgId}
            isLoading={isLoading}
            loadingMsgId={loadingMsgId}
            onCopyMessage={onCopyMessage}
            onReadMessage={onReadMessage}
          />
        )}
      </div>
    </div>
  );
};

export default MessageItem;