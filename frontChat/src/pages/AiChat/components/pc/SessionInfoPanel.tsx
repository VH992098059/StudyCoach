import React, { useMemo, useState } from 'react';
import { Card, Button, Empty, Tooltip, Tag, Input, Segmented, Space, Slider } from 'antd';
import { FileTextOutlined, CopyOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import KnowledgeSelector, { type KnowledgeSelectorRef } from '@/components/KnowledgeSelector';
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
  advancedSettings: { topK: number; score: number };
  onAdvancedSettingsChange: (field: 'topK' | 'score', value: number) => void;
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
    advancedSettings,
    onAdvancedSettingsChange,
    referenceDocuments,
    showReferences,
    onToggleReferences,
    isReferenceScrolling,
    onReferenceScroll,
    onCopyDocumentContent,
  } = props;

  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'similarity' | 'title'>('similarity');

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = q
      ? referenceDocuments.filter((d) =>
          (d.title || '').toLowerCase().includes(q) || (d.content || '').toLowerCase().includes(q)
        )
      : referenceDocuments;
    if (sortMode === 'similarity') {
      return [...items].sort((a, b) => b.similarity - a.similarity);
    }
    return [...items].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [referenceDocuments, query, sortMode]);

  const handleCopyAll = () => {
    if (!filteredDocs.length) return;
    const text = filteredDocs
      .map((d, i) => {
        const header = `#${i + 1} ${d.title || t('chat.sidebar.unnamedSession')} (${(d.similarity * 100).toFixed(1)}%)`;
        const urlLine = d.url ? `\nLink: ${d.url}` : '';
        return `${header}${urlLine}\n\n${d.content}`;
      })
      .join('\n\n---\n\n');
    onCopyDocumentContent(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        size="small"
        title={t('chat.info.title')}
        extra={
          <Space size={8}>
            <Tag color={isNetworkEnabled ? 'green' : 'red'} style={{ marginRight: 0 }}>{isNetworkEnabled ? t('chat.info.networkEnabled') : t('chat.info.networkDisabled')}</Tag>
            <Button type="text" icon={<FileTextOutlined />} onClick={onToggleReferences} size="small">
              {showReferences ? t('chat.info.hideReferences') : t('chat.info.showReferences')}
            </Button>
          </Space>
        }
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
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap',flexDirection:"column", fontSize: isTablet ? 11 : 12, color: '#666' }}>
          <div>{t('chat.info.id')}: {currentSessionId || t('chat.info.notStarted')}</div>
          <div>{t('chat.info.messageCount')}: {messagesCount}</div>
          <div>{t('chat.info.referenceDocs')}: {referenceDocuments.length} {t('chat.info.countUnit')}</div>
        </div>
        <div style={{ marginTop: 8}}>
          <div style={{ fontSize: isTablet ? 11 : 12, color: '#333', marginBottom: 6 }}>{t('chat.info.advancedSettings')}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isTablet ? 11 : 12, color: '#666', marginBottom: 4 }}>{t('chat.info.returnCount')}: {advancedSettings.topK}</div>
              <Slider min={1} max={10} value={advancedSettings.topK} onChange={(value: number) => onAdvancedSettingsChange('topK', value)} marks={{ 1: '1', 5: '5', 10: '10' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isTablet ? 11 : 12, color: '#666', marginBottom: 4 }}>{t('chat.info.similarity')}: {advancedSettings.score}</div>
              <Slider min={0} max={1} step={0.1} value={advancedSettings.score} onChange={(value: number) => onAdvancedSettingsChange('score', value)} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
            </div>
          </div>
        </div>
      </Card>

      {showReferences && (
        <Card
          size="small"
          title={t('chat.info.referenceDocs')}
          extra={
            <Space size={8}>
              <Button type="text" size="small" onClick={handleCopyAll} icon={<CopyOutlined />}>{t('chat.info.copyAll')}</Button>
              <Button type="text" size="small" onClick={onToggleReferences}>{t('chat.info.collapse')}</Button>
            </Space>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,flexDirection:"column"}}>
            <Input
              allowClear
              size={isTablet ? 'small' : 'middle'}
              placeholder={t('chat.info.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Segmented
              size={isTablet ? 'small' : 'middle'}
              value={sortMode}
              onChange={(v) => setSortMode(v as 'similarity' | 'title')}
              options={[
                { label: t('chat.info.sortBySimilarity'), value: 'similarity' },
                { label: t('chat.info.sortByTitle'), value: 'title' },
              ]}
            />
          </div>

          <div
            style={{
              maxHeight: isTablet ? 300 : 420,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: isReferenceScrolling ? '#d4d4d4 transparent' : 'transparent transparent',
              paddingRight: 4,height:"calc(400px - 37px)",
            }}
            className={`custom-scrollbar ${isReferenceScrolling ? 'scrolling' : ''}`}
            onScroll={onReferenceScroll}
          >
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <Card key={doc.id} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: isTablet ? 12 : 13, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                      <div style={{ fontSize: isTablet ? 10 : 11, color: '#666', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color="blue">{t('chat.info.similarity')} {(doc.similarity * 100).toFixed(1)}%</Tag>
                        <Tag color="green">{t('chat.info.source')} {doc.source}</Tag>
                        {doc.url ? (
                          <Button type="link" size="small" icon={<LinkOutlined />} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ padding: 0 }}>
                            {t('chat.info.openLink')}
                          </Button>
                        ) : null}
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
                  <div style={{ fontSize: isTablet ? 10 : 11, color: '#333', lineHeight: '1.5' }}>
                    <MDEditor.Markdown
                      source={
                        doc.content.length > (isTablet ? 120 : 160)
                          ? doc.content.substring(0, isTablet ? 120 : 160) + '...'
                          : doc.content
                      }
                      style={{ backgroundColor: 'transparent', fontSize: isTablet ? 10 : 11 }}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Empty description={t('chat.info.noMatchingDocs')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SessionInfoPanel;