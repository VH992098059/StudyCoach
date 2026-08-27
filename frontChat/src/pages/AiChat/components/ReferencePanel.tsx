/**
 * 参考文档面板（设计文档 4.1 / 3.4：250px，卡片含来源 + 分数胶囊 + 摘要关键词高亮）
 * 数据来自 useReferences；检索设置（TopK/Score）收纳进头部 Popover；
 * PC 端为右栏固定面板，≤1100px 与移动端由 SessionInfoDrawer 以浮层承载。
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, FileText, Search, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmptyState } from '@/components/common/EmptyState';
import type { ReferenceDocument } from './useReferences';

export interface ReferencePanelProps {
  referenceDocuments: ReferenceDocument[];
  advancedSettings: { topK: number; score: number };
  onAdvancedSettingsChange: (field: 'topK' | 'score', value: number) => void;
  onCopyDocumentContent?: (text: string) => void;
  className?: string;
}

/** 摘要关键词高亮：按查询词分词，命中部分以 mark-bg 底色标记 */
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const tokens = useMemo(
    () => query.trim().split(/\s+/).filter((s) => s.length > 0).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    [query],
  );
  if (tokens.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${tokens.join('|')})`, 'gi'));
  const isToken = (s: string) => tokens.some((tk) => new RegExp(`^${tk}$`, 'i').test(s));
  return (
    <>
      {parts.map((part, i) =>
        isToken(part) ? (
          <mark key={i} className="rounded-[2px] bg-mark-bg px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

/** 分数胶囊：mono 等宽，按分数分档着色 */
const ScorePill: React.FC<{ score: number }> = ({ score }) => {
  const pct = (score * 100).toFixed(1);
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-1.5 py-px font-mono text-[10.5px] leading-4',
        score >= 0.8
          ? 'border-primary/40 bg-primary-bg text-primary'
          : score >= 0.5
            ? 'border-border-strong text-text-2'
            : 'border-border text-text-4',
      )}
    >
      {pct}%
    </span>
  );
};

const SUMMARY_LIMIT = 150;

const ReferencePanel: React.FC<ReferencePanelProps> = ({
  referenceDocuments,
  advancedSettings,
  onAdvancedSettingsChange,
  onCopyDocumentContent,
  className,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'similarity' | 'title'>('similarity');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = q
      ? referenceDocuments.filter(
          (d) => (d.title || '').toLowerCase().includes(q) || (d.content || '').toLowerCase().includes(q),
        )
      : referenceDocuments;
    if (sortMode === 'similarity') return [...items].sort((a, b) => b.similarity - a.similarity);
    return [...items].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [referenceDocuments, query, sortMode]);

  const copy = (text: string) => {
    if (onCopyDocumentContent) {
      onCopyDocumentContent(text);
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast.success(t('chat.copySuccess')),
      () => toast.error(t('chat.copyFailed')),
    );
  };

  const handleCopyAll = () => {
    if (!filteredDocs.length) return;
    const text = filteredDocs
      .map((d, i) => {
        const header = `#${i + 1} ${d.title || t('chat.sidebar.unnamedSession')} (${(d.similarity * 100).toFixed(1)}%)`;
        const urlLine = d.url ? `\nLink: ${d.url}` : '';
        return `${header}${urlLine}\n\n${d.content}`;
      })
      .join('\n\n---\n\n');
    copy(text);
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {/* 头部：标题 + 计数 + 设置/复制 */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        <span className="text-[12.5px] font-medium text-text-2">{t('chat.info.referenceDocs')}</span>
        <span className="rounded-full bg-primary-bg px-1.5 font-mono text-[10.5px] leading-4 text-primary">
          {referenceDocuments.length}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-text-3 hover:text-text-1"
                aria-label={t('chat.info.advancedSettings')}
              >
                <Settings2 className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <div className="mb-3 text-xs font-medium text-text-1">{t('chat.info.advancedSettings')}</div>
              <div className="mb-1 flex items-center justify-between text-[11px] text-text-3">
                <span>{t('chat.info.returnCount')}</span>
                <span className="font-mono text-text-1">{advancedSettings.topK}</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[advancedSettings.topK]}
                onValueChange={([v]) => onAdvancedSettingsChange('topK', v)}
              />
              <div className="mt-3 mb-1 flex items-center justify-between text-[11px] text-text-3">
                <span>{t('chat.info.similarity')}</span>
                <span className="font-mono text-text-1">{advancedSettings.score.toFixed(1)}</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[advancedSettings.score]}
                onValueChange={([v]) => onAdvancedSettingsChange('score', v)}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-text-3 hover:text-text-1"
            onClick={handleCopyAll}
            disabled={filteredDocs.length === 0}
            aria-label={t('chat.info.copyAll')}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 搜索 + 排序 */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-text-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('chat.info.searchPlaceholder')}
            className="h-7 rounded-md pl-7 text-xs"
          />
        </div>
        <div className="flex shrink-0 rounded-md border border-border p-0.5">
          {(
            [
              ['similarity', t('chat.info.sortBySimilarity')],
              ['title', t('chat.info.sortByTitle')],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSortMode(mode)}
              className={cn(
                'cursor-pointer rounded-[3px] px-1.5 py-0.5 text-[11px] transition-colors',
                sortMode === mode ? 'bg-primary-bg text-primary' : 'text-text-3 hover:text-text-2',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 文档卡片列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group mb-1.5 rounded-md border border-border bg-surface px-2.5 py-2 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start gap-1.5">
                <FileText className="mt-0.5 size-3.5 shrink-0 text-text-4" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-text-1"
                      title={doc.title}
                    >
                      {doc.title}
                    </span>
                    <ScorePill score={doc.similarity} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0 text-text-4 opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-1"
                      onClick={() => copy(doc.content)}
                      aria-label={t('chat.info.copyContent')}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-text-4">
                    <span className="truncate">{doc.source}</span>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:underline"
                      >
                        {t('chat.info.openLink')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-1.5 line-clamp-4 text-[11.5px] leading-[1.6] text-text-3">
                <HighlightText
                  text={doc.content.length > SUMMARY_LIMIT ? doc.content.slice(0, SUMMARY_LIMIT) + '…' : doc.content}
                  query={query}
                />
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<FileText />}
            title={t('chat.info.noMatchingDocs')}
            className="py-12"
          />
        )}
      </div>
    </div>
  );
};

export default ReferencePanel;
