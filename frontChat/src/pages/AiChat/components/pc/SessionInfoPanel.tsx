import React, { useMemo, useState } from 'react';
import { Card, Button, Empty, Tooltip, Tag, Input, Segmented, Space, Slider } from 'antd';
import { FileTextOutlined, CopyOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
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
        const header = `#${i + 1} ${d.title || '未命名'} (${(d.similarity * 100).toFixed(1)}%)`;
        const urlLine = d.url ? `\n链接: ${d.url}` : '';
        return `${header}${urlLine}\n\n${d.content}`;
      })
      .join('\n\n---\n\n');
    onCopyDocumentContent(text);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        size="small"
        title="会话信息"
        extra={
          <Space size={8}>
            <Tag color={isNetworkEnabled ? 'green' : 'red'} style={{ marginRight: 0 }}>{isNetworkEnabled ? '联网已开启' : '联网已关闭'}</Tag>
            <Button type="text" icon={<FileTextOutlined />} onClick={onToggleReferences} size="small">
              {showReferences ? '隐藏参考' : '显示参考'}
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
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: isTablet ? 11 : 12, color: '#666' }}>
          <div>会话ID: {currentSessionId || '未开始'}</div>
          <div>消息数: {messagesCount}</div>
          <div>参考文档: {referenceDocuments.length} 条</div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: isTablet ? 11 : 12, color: '#333', marginBottom: 6 }}>高级选项</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isTablet ? 11 : 12, color: '#666', marginBottom: 4 }}>返回数量: {advancedSettings.topK}</div>
              <Slider min={1} max={10} value={advancedSettings.topK} onChange={(value: number) => onAdvancedSettingsChange('topK', value)} marks={{ 1: '1', 5: '5', 10: '10' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: isTablet ? 11 : 12, color: '#666', marginBottom: 4 }}>相似度: {advancedSettings.score}</div>
              <Slider min={0} max={1} step={0.1} value={advancedSettings.score} onChange={(value: number) => onAdvancedSettingsChange('score', value)} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
            </div>
          </div>
        </div>
      </Card>

      {showReferences && (
        <Card
          size="small"
          title="参考文档"
          extra={
            <Space size={8}>
              <Button type="text" size="small" onClick={handleCopyAll} icon={<CopyOutlined />}>复制全部</Button>
              <Button type="text" size="small" onClick={onToggleReferences}>收起</Button>
            </Space>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Input
              allowClear
              size={isTablet ? 'small' : 'middle'}
              placeholder="搜索标题或内容"
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
                { label: '按相似度', value: 'similarity' },
                { label: '按标题', value: 'title' },
              ]}
            />
          </div>

          <div
            style={{
              maxHeight: isTablet ? 300 : 420,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: isReferenceScrolling ? '#d4d4d4 transparent' : 'transparent transparent',
              paddingRight: 4,
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
                        <Tag color="blue">相似度 {(doc.similarity * 100).toFixed(1)}%</Tag>
                        <Tag color="green">来源 {doc.source}</Tag>
                        {doc.url ? (
                          <Button type="link" size="small" icon={<LinkOutlined />} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ padding: 0 }}>
                            打开链接
                          </Button>
                        ) : null}
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
              <Empty description="暂无匹配的参考文档" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SessionInfoPanel;