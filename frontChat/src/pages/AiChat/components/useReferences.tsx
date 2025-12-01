/**
 * @fileoverview 参考文档与高级设置 Hook
 * @description 管理知识库选择、TopK/Score 参数、参考文档列表、
 * references 面板显隐及滚动状态节流。
 */
import { useCallback, useRef, useState } from 'react';
import { RetrieverService, type RetrievalDocument } from '../../../services/retriever';

export interface ReferenceDocument {
  id: string;
  title: string;
  content: string;
  similarity: number;
  source: string;
  url?: string;
}

export interface AdvancedSettings {
  topK: number;
  score: number;
}

const useReferences = () => {
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>('none');
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({ topK: 5, score: 0.5 });
  const [referenceDocuments, setReferenceDocuments] = useState<ReferenceDocument[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [isReferenceScrolling, setIsReferenceScrolling] = useState(false);
  const referenceScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKnowledgeChange = (knowledgeId: string) => {
    setSelectedKnowledge(knowledgeId);
  };

  const handleAdvancedSettingsChange = (field: keyof AdvancedSettings, value: number) => {
    setAdvancedSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleAdvancedSettings = () => {
    setShowAdvancedSettings((prev) => !prev);
  };

  const handleToggleReferences = () => {
    setShowReferences((prev) => !prev);
  };

  const handleReferenceScroll = () => {
    setIsReferenceScrolling(true);
    if (referenceScrollTimeoutRef.current) {
      clearTimeout(referenceScrollTimeoutRef.current);
    }
    referenceScrollTimeoutRef.current = setTimeout(() => {
      setIsReferenceScrolling(false);
    }, 1000);
  };

  const fetchReferenceDocuments = useCallback(async (query: string): Promise<ReferenceDocument[]> => {
    if (!selectedKnowledge || selectedKnowledge === 'none') return [];

    try {
      const res = await RetrieverService.retrieve({
        question: query,
        knowledge_name: selectedKnowledge,
        top_k: advancedSettings.topK,
        score: advancedSettings.score,
      });

      const docs = res.document || [];
      const references: ReferenceDocument[] = docs.map((doc: RetrievalDocument, index: number) => ({
        id: doc.id || String(index),
        title: doc.meta_data?.ext?._file_name || `文档片段 ${index + 1}`,
        content: doc.content,
        similarity: doc.score || doc.meta_data?._score || 0,
        source: doc.meta_data?.ext?._file_name || '未知来源',
        url: '',
      }));

      setReferenceDocuments(references);
      setShowReferences(references.length > 0);
      return references;
    } catch (error) {
      console.error('获取参考文档失败:', error);
      setReferenceDocuments([]);
      setShowReferences(false);
      return [];
    }
  }, [selectedKnowledge, advancedSettings]);

  return {
    selectedKnowledge,
    advancedSettings,
    referenceDocuments,
    showAdvancedSettings,
    showReferences,
    isReferenceScrolling,
    setSelectedKnowledge,
    setAdvancedSettings,
    setReferenceDocuments,
    setShowAdvancedSettings,
    setShowReferences,
    handleKnowledgeChange,
    handleAdvancedSettingsChange,
    handleToggleAdvancedSettings,
    handleToggleReferences,
    handleReferenceScroll,
    fetchReferenceDocuments,
  };
};

export default useReferences;