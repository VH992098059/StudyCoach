/**
 * 移动端会话抽屉（设计文档 4.1：移动端 off-canvas 抽屉 + 遮罩）
 * 复用 ChatSidebar 内容，Sheet 左侧滑出
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatSession } from '@/types/chat';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ChatSidebar from '../pc/ChatSidebar';

export interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  chatSessions: ChatSession[];
  currentSessionId?: string;
  onCreateSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  open,
  onClose,
  chatSessions,
  currentSessionId,
  onCreateSession,
  onLoadSession,
  onDeleteSession,
}) => {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[260px] gap-0 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('chat.sidebar.title')}</SheetTitle>
        </SheetHeader>
        <ChatSidebar
          className="w-full border-r-0"
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onCreateSession={onCreateSession}
          onLoadSession={onLoadSession}
          onDeleteSession={onDeleteSession}
          onSessionSelect={onClose}
        />
      </SheetContent>
    </Sheet>
  );
};

export default SidebarDrawer;
