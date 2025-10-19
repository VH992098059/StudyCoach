import React from 'react';
import { Button, List, Popconfirm, Typography } from 'antd';
import { LeftOutlined, RightOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ChatSession } from '../../../types/chat';

const { Title } = Typography;

export interface ChatSidebarProps {
  isTablet: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  chatSessions: ChatSession[];
  currentSessionId?: string;
  isScrolling: boolean;
  onScroll: () => void;
  onCreateSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function ChatSidebar(props: ChatSidebarProps) {
  const {
    isTablet,
    collapsed,
    onToggleCollapsed,
    chatSessions,
    currentSessionId,
    isScrolling,
    onScroll,
    onCreateSession,
    onLoadSession,
    onDeleteSession,
  } = props;

  return (
    <div
      className={`left-panel ${collapsed ? 'collapsed' : ''}`}
      style={{
        width: collapsed ? 60 : isTablet ? 240 : 300,
        transition: 'width 0.2s ease',
      }}
    >
      <div className="panel-header">
        {!collapsed && (
          <Title level={5} style={{ margin: 0 }}>
            聊天记录
          </Title>
        )}
        <Button
          shape="circle"
          size="small"
          onClick={onToggleCollapsed}
          icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
          aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
        />
      </div>

      {!collapsed && (
        <div
          className={`custom-scrollbar ${isScrolling ? 'scrolling' : ''}`}
          onScroll={onScroll}
          style={{ overflow: 'auto', height: 'calc(100% - 44px)' }}
        >
          <div style={{ padding: 8 }}>
            <Button
              type="primary"
              block
              icon={<PlusOutlined />}
              onClick={onCreateSession}
            >
              新建会话
            </Button>
          </div>

          <List
            size="small"
            dataSource={chatSessions}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                className={item.id === currentSessionId ? 'active' : ''}
                onClick={() => onLoadSession(item.id)}
                actions={[
                  <Popconfirm
                    key="del"
                    title="删除该会话？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDeleteSession(item.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={item.title || '未命名会话'}
                  description={
                    item.updatedAt
                      ? new Date(item.updatedAt).toLocaleString()
                      : undefined
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
}