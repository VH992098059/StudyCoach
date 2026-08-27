/**
 * @fileoverview 知识库页（三 Tab：知识库 / 上传索引 / 检索测试）
 * @description 原 KnowledgeBase、Indexer、Retriever 三个独立页面合并
 * （设计文档 2.3 信息架构）。Tab 状态写入 URL ?tab=，支持从详情页
 * "上传文档"跳转（?tab=indexer&kb=库名）直达。
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHead } from '@/components/common/PageHead';
import KbListTab from './tabs/KbListTab';
import IndexerTab from './tabs/IndexerTab';
import RetrieverTab from './tabs/RetrieverTab';

const VALID_TABS = ['list', 'indexer', 'retriever'] as const;
type TabKey = (typeof VALID_TABS)[number];

const KnowledgeBasePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const activeTab: TabKey = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'list';
  const kbParam = searchParams.get('kb') ?? undefined;

  const handleTabChange = useCallback(
    (tab: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        // 切 Tab 时清除一次性参数 kb
        if (tab !== 'indexer') next.delete('kb');
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  return (
    <div className="mx-auto w-full max-w-[960px] flex-1 px-5 py-6 md:px-8">
      <PageHead title={t('kb.title')} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
        <TabsList variant="line" className="h-auto gap-4">
          <TabsTrigger value="list" className="px-1 py-1.5 text-[13.5px]">
            {t('kb.tabs.list')}
          </TabsTrigger>
          <TabsTrigger value="indexer" className="px-1 py-1.5 text-[13.5px]">
            {t('kb.tabs.indexer')}
          </TabsTrigger>
          <TabsTrigger value="retriever" className="px-1 py-1.5 text-[13.5px]">
            {t('kb.tabs.retriever')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-5">
          <KbListTab />
        </TabsContent>
        <TabsContent value="indexer" className="mt-5">
          <IndexerTab initialKb={kbParam} />
        </TabsContent>
        <TabsContent value="retriever" className="mt-5">
          <RetrieverTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeBasePage;
