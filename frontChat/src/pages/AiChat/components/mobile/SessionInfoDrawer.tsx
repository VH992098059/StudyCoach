/**
 * 移动端参考文档浮层（设计文档 4.1：≤1100px 参考面板隐藏为浮层）
 * Sheet 右侧滑出，内容由 ReferencePanel 提供
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ReferencePanel from '../ReferencePanel';
import type { ReferenceDocument } from '../useReferences';

export interface SessionInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  referenceDocuments: ReferenceDocument[];
  advancedSettings: { topK: number; score: number };
  onAdvancedSettingsChange: (field: 'topK' | 'score', value: number) => void;
  onCopyDocumentContent?: (text: string) => void;
}

const SessionInfoDrawer: React.FC<SessionInfoDrawerProps> = ({
  open,
  onClose,
  referenceDocuments,
  advancedSettings,
  onAdvancedSettingsChange,
  onCopyDocumentContent,
}) => {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[280px] gap-0 p-0 sm:max-w-[280px]">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('chat.info.referenceDocs')}</SheetTitle>
        </SheetHeader>
        <ReferencePanel
          className="w-full"
          referenceDocuments={referenceDocuments}
          advancedSettings={advancedSettings}
          onAdvancedSettingsChange={onAdvancedSettingsChange}
          onCopyDocumentContent={onCopyDocumentContent}
        />
      </SheetContent>
    </Sheet>
  );
};

export default SessionInfoDrawer;
