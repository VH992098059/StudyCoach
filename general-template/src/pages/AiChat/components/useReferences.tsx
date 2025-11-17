import { useCallback, useRef, useState } from 'react';

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
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({ topK: 5, score: 0.7 });
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
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockReferences: ReferenceDocument[] = [
      {
        id: '1',
        title: '相关文档片段 1',
        content: `这是与查询"${query}"相关的文档内容。包含了详细的技术说明和实现方案。`,
        similarity: 0.95,
        source: '技术文档.pdf',
        url: '/docs/tech-doc.pdf',
      },
      {
        id: '2',
        title: '相关文档片段 2',
        content: `另一个相关的文档片段，提供了补充信息和最佳实践建议。`,
        similarity: 0.87,
        source: '最佳实践.md',
        url: '/docs/best-practices.md',
      },
      {
        id: '3',
        title: '相关文档片段 3',
        content: `第三个相关文档，包含了具体的代码示例和配置说明。`,
        similarity: 0.82,
        source: '配置指南.txt',
        url: '/docs/config-guide.txt',
      },
    ];
    const filtered = mockReferences.filter((ref) => ref.similarity >= advancedSettings.score).slice(0, advancedSettings.topK);
    setReferenceDocuments(filtered);
    setShowReferences(filtered.length > 0);
    return filtered;
  }, [advancedSettings]);

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