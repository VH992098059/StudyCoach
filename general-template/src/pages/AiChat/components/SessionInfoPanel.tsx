import React from 'react';
import { Card, Button, Empty, Tooltip, Tag } from 'antd';
import { FileTextOutlined, CopyOutlined } from '@ant-design/icons';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '../../../components/KnowledgeSelector';
import MDEditor from '@uiw/react-md-editor';

export interface ReferenceDocument {
  id: string;
  title: string;
  content: string;
  similarity: number;
  source: string;
  url?: string;
}

export interface SessionInfoPanelProps {
  isTablet: boolean;
  currentSessionId?: string;
  messagesCount: number;
  selectedKnowledge: string;
  knowledgeSelectorRef: React.Ref<KnowledgeSelectorRef>;
  onKnowledgeChange: (id: string) => void;
  isNetworkEnabled: boolean;
  referenceDocuments: ReferenceDocument[];
  showReferences: boolean;
  onToggleReferences: () => void;
  isReferenceScrolling: boolean;
  onReferenceScroll: () => void;
  onCopyDocumentContent: (text: string) => void;
}

const SessionInfoPanel: React.FC<SessionInfoPanelProps> = (props: SessionInfoPanelProps) => {
  const {
    isTablet,
    currentSessionId,
    messagesCount,
    selectedKnowledge,
    knowledgeSelectorRef,
    onKnowledgeChange,
    isNetworkEnabled,
    referenceDocuments,
    showReferences,
    onToggleReferences,
    isReferenceScrolling,
    onReferenceScroll,
    onCopyDocumentContent,
  } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        size="small"
        title="会话信息"
        extra={<Button type="text" icon={<FileTextOutlined />} onClick={onToggleReferences} size="small" />}
      >
        <div style={{ marginBottom: 8 }}>
          <KnowledgeSelector
            ref={knowledgeSelectorRef}
            value={selectedKnowledge}
            onChange={onKnowledgeChange}
            style={{ width: '100%' }}
            size={isTablet ? 'small' : 'middle'}
          />
        </div>
        <div style={{ fontSize: isTablet ? 11 : 12, color: '#666' }}>
          <div>会话ID: {currentSessionId || '未开始'}</div>
          <div>消息数: {messagesCount}</div>
          <div>联网: {isNetworkEnabled ? '已开启' : '已关闭'}</div>
          <div>参考文档: {referenceDocuments.length} 条</div>
        </div>
      </Card>

      {showReferences && (
        <Card
          size="small"
          title="参考文档"
          extra={
            <Button type="text" size="small" onClick={onToggleReferences}>
              收起
            </Button>
          }
        >
          <div
            style={{
              maxHeight: isTablet ? 300 : 400,
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
                      <div style={{ fontWeight: 'bold', fontSize: isTablet ? 11 : 12, marginBottom: 2 }}>{doc.title}</div>
                      <div style={{ fontSize: isTablet ? 10 : 11, color: '#666', marginBottom: 4 }}>
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
                  <div style={{ fontSize: isTablet ? 10 : 11, color: '#333', lineHeight: '1.4' }}>
                    <MDEditor.Markdown
                      source={
                        doc.content.length > (isTablet ? 60 : 80)
                          ? doc.content.substring(0, isTablet ? 60 : 80) + '...'
                          : doc.content
                      }
                      style={{ backgroundColor: 'transparent', fontSize: isTablet ? 10 : 11 }}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Empty description="暂无参考文档" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SessionInfoPanel;