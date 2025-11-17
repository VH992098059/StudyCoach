import React from 'react';
import { Drawer, List, Button, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ChatSession } from '../../../types/chat';

export interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  currentSessionId?: string;
  onCreateSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SidebarDrawer: React.FC<SidebarDrawerProps> = (props: SidebarDrawerProps) => {
  const {
    open,
    onClose,
    chatSessions,
    currentSessionId,
    onCreateSession,
    onLoadSession,
    onDeleteSession,
  } = props;

  return (
    <Drawer
      title="会话列表"
      placement="left"
      closable
      onClose={onClose}
      open={open}
      width={280}
    >
      <Button
        type="primary"
        block
        icon={<PlusOutlined />}
        style={{ marginBottom: 12 }}
        onClick={onCreateSession}
      >
        新建会话
      </Button>

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
                item.updatedAt ? new Date(item.updatedAt).toLocaleString() : undefined
              }
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default SidebarDrawer;