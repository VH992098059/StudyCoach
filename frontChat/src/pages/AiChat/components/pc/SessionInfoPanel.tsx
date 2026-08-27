/**
 * PC 端参考文档右栏（设计文档 4.1：250px 可收起，≤1100px 由浮层承载）
 * 内容由 ReferencePanel 提供
 */

import React from 'react';
import ReferencePanel from '../ReferencePanel';
import type { ReferenceDocument } from '../useReferences';

export interface SessionInfoPanelProps {
  referenceDocuments: ReferenceDocument[];
  advancedSettings: { topK: number; score: number };
  onAdvancedSettingsChange: (field: 'topK' | 'score', value: number) => void;
  onCopyDocumentContent?: (text: string) => void;
}

const SessionInfoPanel: React.FC<SessionInfoPanelProps> = (props) => (
  <div className="h-full w-[250px] shrink-0 border-l border-border bg-background">
    <ReferencePanel {...props} className="w-full" />
  </div>
);

export default React.memo(SessionInfoPanel);
