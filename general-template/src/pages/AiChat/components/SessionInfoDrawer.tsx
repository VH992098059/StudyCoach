import React from 'react';
import { Drawer, Divider, Card, Button, Empty, Tooltip, Tag } from 'antd';
import { FileTextOutlined, CopyOutlined } from '@ant-design/icons';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '../../../components/KnowledgeSelector';
import MDEditor from '@uiw/react-md-editor';
import type { ReferenceDocument } from './SessionInfoPanel';

export interface SessionInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  showReferences: boolean;
  onToggleReferences: () => void;
  currentSessionId?: string;
  messagesCount: number;
  selectedKnowledge: string;
  knowledgeSelectorRef: React.Ref<KnowledgeSelectorRef>;
  onKnowledgeChange: (id: string) => void;
  isNetworkEnabled: boolean;
  referenceDocuments: ReferenceDocument[];
  isReferenceScrolling: boolean;
  onReferenceScroll: () => void;
  onCopyDocumentContent: (text: string) => void;
}

const SessionInfoDrawer: React.FC<SessionInfoDrawerProps> = (props: SessionInfoDrawerProps) => {
  const {
    open,
    onClose,
    showReferences,
    onToggleReferences,
    currentSessionId,
    messagesCount,
    selectedKnowledge,
    knowledgeSelectorRef,
    onKnowledgeChange,
    isNetworkEnabled,
    referenceDocuments,
    isReferenceScrolling,
    onReferenceScroll,
    onCopyDocumentContent,
  } = props;

  return (
    <Drawer
      title="会话信息"
      placement="right"
      onClose={onClose}
      open={open}
      width={300}
      extra={<Button type="text" icon={<FileTextOutlined />} onClick={onToggleReferences} size="small" />}
    >
      <div style={{ marginBottom: 12 }}>
        <KnowledgeSelector
          ref={knowledgeSelectorRef}
          value={selectedKnowledge}
          onChange={onKnowledgeChange}
          style={{ width: '100%' }}
          size={'middle'}
        />
      </div>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
        <div>会话ID: {currentSessionId || '未开始'}</div>
        <div>消息数: {messagesCount}</div>
        <div>联网: {isNetworkEnabled ? '已开启' : '已关闭'}</div>
        <div>参考文档: {referenceDocuments.length} 条</div>
      </div>

      {showReferences && (
        <div>
          <Divider style={{ margin: '12px 0' }}>参考文档</Divider>
          <div
            style={{
              maxHeight: 400,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: isReferenceScrolling ? '#d4d4d4 transparent' : 'transparent transparent',
            }}
            className={`custom-scrollbar ${isReferenceScrolling ? 'scrolling' : ''}`}
            onScroll={onReferenceScroll}
          >
            {referenceDocuments.length > 0 ? (
              referenceDocuments.map((doc) => (
                <Card key={doc.id} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>{doc.title}</div>
                      <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
                        <Tag color="blue">相似度: {(doc.similarity * 100).toFixed(1)}%</Tag>
                        <Tag color="green">来源: {doc.source}</Tag>
                      </div>
                    </div>
                    <Tooltip title="复制内容">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        size="small"
                        onClick={() => onCopyDocumentContent(doc.content)}
                      />
                    </Tooltip>
                  </div>
                  <div style={{ fontSize: 10, color: '#333', lineHeight: '1.4' }}>
                    <MDEditor.Markdown
                      source={doc.content.length > 60 ? doc.content.substring(0, 60) + '...' : doc.content}
                      style={{ backgroundColor: 'transparent', fontSize: 10 }}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Empty description="暂无参考文档" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default SessionInfoDrawer;