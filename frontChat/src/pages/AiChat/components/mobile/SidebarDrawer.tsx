import React from 'react';
import { Drawer, List, Button, Modal } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ChatSession } from '@/types/chat';

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
        itemLayout="horizontal"
        dataSource={chatSessions}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: 'pointer' }}
            className={item.id === currentSessionId ? 'active' : ''}
            onClick={() => onLoadSession(item.id)}
          >
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <List.Item.Meta
                style={{ minWidth: 0 }}
                title={<div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || '未命名会话'}</div>}
                description={
                  item.updatedAt ? new Date(item.updatedAt).toLocaleString() : undefined
                }
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  Modal.confirm({
                    title: '删除该会话？',
                    content: (
                      <div style={{ color: '#666' }}>
                        <div>会话标题：{item.title || '未命名会话'}</div>
                        <div style={{ marginTop: 8 }}>删除后不可恢复。</div>
                      </div>
                    ),
                    okText: '删除',
                    okButtonProps: { danger: true },
                    cancelText: '取消',
                    centered: true,
                    zIndex: 2100,
                    getContainer: () => document.body,
                    maskClosable: true,
                    keyboard: true,
                    onOk: () => onDeleteSession(item.id),
                  });
                }}
                style={{ flexShrink: 0 }}
              >删除</Button>
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default SidebarDrawer;