import React from 'react';
import { Drawer, Divider, Card, Button, Empty, Tooltip, Tag, Slider } from 'antd';
import { FileTextOutlined, CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
import MDEditor from '@uiw/react-md-editor';
import type { ReferenceDocument } from '../pc/SessionInfoPanel';

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
  advancedSettings: { topK: number; score: number };
  onAdvancedSettingsChange: (field: 'topK' | 'score', value: number) => void;
  referenceDocuments: ReferenceDocument[];
  isReferenceScrolling: boolean;
  onReferenceScroll: () => void;
  onCopyDocumentContent: (text: string) => void;
}

const SessionInfoDrawer: React.FC<SessionInfoDrawerProps> = (props: SessionInfoDrawerProps) => {
  const { t } = useTranslation();
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
    advancedSettings,
    onAdvancedSettingsChange,
    referenceDocuments,
    isReferenceScrolling,
    onReferenceScroll,
    onCopyDocumentContent,
  } = props;

  return (
    <Drawer
      title={t('chat.info.title')}
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
        <div>{t('chat.info.id')}: {currentSessionId || t('chat.info.notStarted')}</div>
        <div>{t('chat.info.messageCount')}: {messagesCount}</div>
        <div>{isNetworkEnabled ? t('chat.info.networkEnabled') : t('chat.info.networkDisabled')}</div>
        <div>{t('chat.info.referenceDocs')}: {referenceDocuments.length} {t('chat.info.countUnit')}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Divider style={{ margin: '12px 0' }}>{t('chat.info.advancedSettings')}</Divider>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{t('chat.info.returnCount')}: {advancedSettings.topK}</div>
        <Slider min={1} max={10} value={advancedSettings.topK} onChange={(value: number) => onAdvancedSettingsChange('topK', value)} marks={{ 1: '1', 5: '5', 10: '10' }} />
        <div style={{ fontSize: 12, color: '#666', margin: '8px 0 6px' }}>{t('chat.info.similarity')}: {advancedSettings.score}</div>
        <Slider min={0} max={1} step={0.1} value={advancedSettings.score} onChange={(value: number) => onAdvancedSettingsChange('score', value)} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
      </div>

      {showReferences && (
        <div>
          <Divider style={{ margin: '12px 0' }}>{t('chat.info.referenceDocs')}</Divider>
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
                        <Tag color="blue">{t('chat.info.similarity')} {(doc.similarity * 100).toFixed(1)}%</Tag>
                        <Tag color="green">{t('chat.info.source')} {doc.source}</Tag>
                      </div>
                    </div>
                    <Tooltip title={t('chat.info.copyContent')}>
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
              <Empty description={t('chat.info.noDocs')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default SessionInfoDrawer;