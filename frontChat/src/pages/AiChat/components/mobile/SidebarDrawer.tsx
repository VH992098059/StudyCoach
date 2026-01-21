import React from 'react';
import { Drawer, List, Button, Modal } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      title={t('chat.sidebar.title')}
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
        {t('chat.sidebar.newSession')}
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
                title={<div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || t('chat.sidebar.unnamedSession')}</div>}
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
                    title: t('chat.sidebar.confirmDeleteTitle'),
                    content: (
                      <div style={{ color: '#666' }}>
                        <div>{t('chat.sidebar.sessionTitle')}{item.title || t('chat.sidebar.unnamedSession')}</div>
                        <div style={{ marginTop: 8 }}>{t('chat.sidebar.deleteWarning')}</div>
                      </div>
                    ),
                    okText: t('chat.sidebar.confirm'),
                    okButtonProps: { danger: true },
                    cancelText: t('chat.sidebar.cancel'),
                    centered: true,
                    zIndex: 2100,
                    getContainer: () => document.body,
                    maskClosable: true,
                    keyboard: true,
                    onOk: () => onDeleteSession(item.id),
                  });
                }}
                style={{ flexShrink: 0 }}
              >{t('chat.sidebar.delete')}</Button>
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
};

export default SidebarDrawer;