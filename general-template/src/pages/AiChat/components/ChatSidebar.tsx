
import { Button, Popconfirm, Typography, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import type { ChatSession } from '../../../types/chat';

const { Title } = Typography;

export interface ChatSidebarProps {
  isTablet: boolean;
  chatSessions: ChatSession[];
  currentSessionId?: string;
  isScrolling: boolean;
  onScroll: () => void;
  onCreateSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = (props: ChatSidebarProps) => {
  const {
    isTablet,
    chatSessions,
    currentSessionId,
    isScrolling,
    onScroll,
    onCreateSession,
    onLoadSession,
    onDeleteSession,
  } = props;

  const groups = (() => {
    const now = new Date();
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();
    const sorted = [...chatSessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const map: { label: string; items: ChatSession[] }[] = [];
    const bucket: Record<string, ChatSession[]> = {};
    for (const item of sorted) {
      const d = new Date(item.updatedAt);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      const label = key === todayKey ? '今天' : key === yesterdayKey ? '昨天' : d.toLocaleDateString();
      (bucket[label] ||= []).push(item);
    }
    for (const label of Object.keys(bucket)) map.push({ label, items: bucket[label] });
    return map;
  })();

  return (
    <div
      style={{
        width: isTablet ? 240 : 320,
        transition: 'width 0.2s ease',
      }}
    >
      <div style={{ padding: 20, borderRadius: 8, background: '#fff', border: '1px solid #f0f0f0', height: 'calc(100vh - 65px)'}}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={5} style={{ margin: 0 }}>会话列表</Title>
          <Button type="primary" size="middle" icon={<PlusOutlined />} onClick={onCreateSession}>新建会话</Button>
        </div>
        <div
          className={`custom-scrollbar ${isScrolling ? 'scrolling' : ''}`}
          onScroll={onScroll}
          style={{ overflow: 'auto', paddingRight: 4, height: 'calc(100vh - 150px)' }}
        >
          {groups.map((group) => (
            <div key={group.label}>
              <div style={{ color: '#8c8c8c', fontSize: 12, padding: '8px 8px' }}>{group.label}</div>
              {group.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onLoadSession(item.id)}
                  style={{
                    margin: '10px 8px',
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: item.id === currentSessionId ? '#e6f4ff' : '#f7f8fa',
                    border: item.id === currentSessionId ? '1px solid #91d5ff' : '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#333', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.title || '未命名会话'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <Tooltip title="更多">
                    <Popconfirm
                      title="删除该会话？"
                      okText="删除"
                      cancelText="取消"
                      onConfirm={(e) => { e?.stopPropagation(); onDeleteSession(item.id); }}
                      onCancel={(e) => e?.stopPropagation()}
                    >
                      <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  </Tooltip>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
import React from 'react';