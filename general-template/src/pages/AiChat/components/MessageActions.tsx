/**
 * 消息操作组件
 * 处理AI消息的复制、朗读等操作功能
 */

import React from 'react';
import { Button, Tooltip, message } from 'antd';
import { CopyOutlined, SoundOutlined, PauseOutlined, LoadingOutlined } from '@ant-design/icons';

interface MessageActionsProps {
  /** 消息内容 */
  content: string;
  /** 消息ID */
  messageId: string;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 是否正在朗读 */
  isReading?: boolean;
  /** 当前朗读的消息ID */
  currentReadingMsgId?: string | null;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 当前加载的消息ID */
  loadingMsgId?: string | null;
  /** 复制消息回调 */
  onCopyMessage?: (content: string) => Promise<void>;
  /** 朗读消息回调 */
  onReadMessage?: (msgId: string, content: string) => void;
}

/**
 * 默认复制AI消息内容到剪贴板
 */
const defaultCopyAiMessage = async (content: string): Promise<void> => {
  try {
    // 移除Markdown语法，只复制纯文本
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
      .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
      .replace(/\n{3,}/g, '\n\n') // 合并多余换行
      .trim();
    
    await navigator.clipboard.writeText(plainText);
    message.success('已复制AI回复内容');
  } catch (error) {
    console.error('复制AI回复失败:', error);
    message.error('复制失败');
  }
};

/**
 * 消息操作组件
 */
const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  messageId,
  isMobile = false,
  isReading = false,
  currentReadingMsgId = null,
  isLoading = false,
  loadingMsgId = null,
  onCopyMessage = defaultCopyAiMessage,
  onReadMessage
}) => {
  const isCurrentlyReading = isReading && currentReadingMsgId === messageId;
  const isCurrentlyLoading = isLoading && loadingMsgId === messageId;
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onCopyMessage(content);
  };

  const handleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReadMessage) {
      onReadMessage(messageId, content);
    }
  };

  const buttonStyle = {
    width: isMobile ? '20px' : '22px',
    height: isMobile ? '20px' : '22px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    fontSize: isMobile ? '10px' : '12px'
  };

  return (
    <div 
      style={{
        display: 'flex',
        gap: '4px',
        opacity: 0.6,
        transition: 'opacity 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.6';
      }}
    >
      <Tooltip title="复制内容">
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          style={{
            ...buttonStyle,
            color: '#999'
          }}
        />
      </Tooltip>
      
      {onReadMessage && (
        <Tooltip title={
          isCurrentlyLoading ? "正在加载..." : 
          isCurrentlyReading ? "停止朗读" : "朗读内容"
        }>
          <Button
            type="text"
            size="small"
            icon={
              isCurrentlyLoading ? <LoadingOutlined spin /> :
              isCurrentlyReading ? <PauseOutlined /> : <SoundOutlined />
            }
            onClick={handleRead}
            disabled={isCurrentlyLoading}
            style={{
              ...buttonStyle,
              color: isCurrentlyLoading ? '#1890ff' : 
                     isCurrentlyReading ? '#1890ff' : '#999'
            }}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default MessageActions;
export { defaultCopyAiMessage };