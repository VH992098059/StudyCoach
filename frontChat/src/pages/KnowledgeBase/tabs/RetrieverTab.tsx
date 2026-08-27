/**
 * @fileoverview 检索测试 Tab（原独立 Retriever 页整体迁移）
 * @description 左侧参数表单（范围 / 查询 / Top-K 滑块 / 阈值滑块），
 * 右侧结果列表（来源 + 分数胶囊 + 关键词高亮摘要）。
 *
 * 数据层原样保留：RetrieverService.retrieve（/gateway/v1/retriever），
 * 默认 top_k=5、score=0.2（与旧版一致）。
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Search, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusPill } from '@/components/common/StatusPill';
import { KnowledgeBaseService, type KnowledgeBase, KBStatus } from '@/services/knowledgeBase';
import { RetrieverService, type RetrievalDocument } from '@/services/retriever';

/** 转义正则特殊字符，用于把查询词安全转为高亮正则 */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const RetrieverTab: React.FC = () => {
  const { t } = useTranslation();

  const [knowledgeList, setKnowledgeList] = useState<KnowledgeBase[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  const [question, setQuestion] = useState('');
  const [knowledgeName, setKnowledgeName] = useState('');
  const [topK, setTopK] = useState(5);
  const [score, setScore] = useState(0.2);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<RetrievalDocument[]>([]);

  useEffect(() => {
    (async () => {
      setKnowledgeLoading(true);
      try {
        const response = await KnowledgeBaseService.getList({ status: KBStatus.OK });
        setKnowledgeList(response.list || []);
      } catch (error) {
        console.error('获取知识库列表失败:', error);
        toast.error(t('retriever.validation.fetchKbFailed'));
      } finally {
        setKnowledgeLoading(false);
      }
    })();
  }, [t]);

  const handleSearch = async () => {
    if (!question.trim()) {
      toast.warning(t('retriever.validation.question'));
      return;
    }
    if (!knowledgeName) {
      toast.warning(t('retriever.validation.kb'));
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await RetrieverService.retrieve({
        question: question.trim(),
        top_k: topK,
        score,
        knowledge_name: knowledgeName,
      });
      const list = response.document || [];
      setResults(list);
      if (list.length === 0) {
        toast.info(t('retriever.noResult'));
      } else {
        toast.success(t('retriever.found', { count: list.length }));
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('retriever.validation.failed'));
    } finally {
      setLoading(false);
    }
  };

  /** 按查询词高亮内容（不使用 dangerouslySetInnerHTML，纯 React 节点切分） */
  const highlightParts = useMemo(() => {
    return (content: string): Array<{ text: string; hit: boolean }> => {
      const query = question.trim();
      if (!query) return [{ text: content, hit: false }];
      try {
        const re = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        // split 含捕获组时，命中片段与查询词完全相等（忽略大小写）
        return content
          .split(re)
          .filter((p) => p !== '')
          .map((p) => ({ text: p, hit: p.toLowerCase() === query.toLowerCase() }));
      } catch {
        return [{ text: content, hit: false }];
      }
    };
  }, [question]);

  const formatScore = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* ============ 左侧：参数表单 ============ */}
      <div className="flex h-fit flex-col gap-4 rounded-md border bg-card p-4 lg:sticky lg:top-[76px]">
        <div className="flex flex-col gap-1.5">
          <Label>{t('retriever.selectKb')}</Label>
          <Select value={knowledgeName} onValueChange={setKnowledgeName}>
            <SelectTrigger disabled={knowledgeLoading}>
              <SelectValue
                placeholder={
                  knowledgeLoading ? t('common.loading') : t('retriever.selectKb')
                }
              />
            </SelectTrigger>
            <SelectContent>
              {knowledgeList.map((kb) => (
                <SelectItem key={kb.id} value={kb.name}>
                  {kb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="retriever-question">{t('retriever.placeholder')}</Label>
          <Input
            id="retriever-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) handleSearch();
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>{t('retriever.topK')}</Label>
            <span className="font-mono text-[12.5px] text-text-2">{topK}</span>
          </div>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[topK]}
            onValueChange={(v) => setTopK(v[0])}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>{t('retriever.score')}</Label>
            <span className="font-mono text-[12.5px] text-text-2">
              {(score * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[score]}
            onValueChange={(v) => setScore(v[0])}
          />
        </div>

        <Button onClick={handleSearch} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            <>
              <Search className="size-4" />
              {t('retriever.search')}
            </>
          )}
        </Button>
      </div>

      {/* ============ 右侧：结果列表 ============ */}
      <div className="flex min-w-0 flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-text-2">
              <FileText className="size-4 text-primary" />
              {t('retriever.result')}
            </div>
            {results.map((result, index) => (
              <div key={result.id ?? index} className="rounded-md border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-medium text-text-1">
                    {t('retriever.fragment')} #{index + 1}
                  </span>
                  <StatusPill tone="mono">
                    {t('retriever.similarity')}: {formatScore(result.meta_data._score)}
                  </StatusPill>
                  <StatusPill tone="primary">
                    {result.meta_data.ext._file_name || t('retriever.unknownSource')}
                  </StatusPill>
                </div>
                <div className="mt-2.5 max-h-64 overflow-y-auto rounded-md bg-hover/40 px-3 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap text-text-body">
                  {highlightParts(result.content).map((part, i) =>
                    part.hit ? (
                      <mark key={i} className="rounded-[2px] bg-mark-bg px-0.5 text-text-1">
                        {part.text}
                      </mark>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </>
        ) : searched ? (
          <EmptyState icon={<Search />} title={t('retriever.noResult')} className="border border-dashed" />
        ) : (
          <EmptyState
            icon={<Search />}
            title={t('retriever.title')}
            description={t('retriever.placeholder')}
            className="border border-dashed"
          />
        )}
      </div>
    </div>
  );
};

export default RetrieverTab;
