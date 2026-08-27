/**
 * 聊天工具栏（设计文档 4.1：会话标题 + 参考文档开关（含计数））
 * 移动端额外提供侧栏/参考面板入口按钮
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, PanelRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ChatTopBarProps {
  isMobile: boolean;
  sessionTitle?: string;
  messagesCount: number;
  /** 参考文档数（含未展开） */
  referenceCount: number;
  showReferences: boolean;
  onToggleReferences: () => void;
  onOpenSidebar: () => void;
}

const ChatTopBar: React.FC<ChatTopBarProps> = ({
  isMobile,
  sessionTitle,
  messagesCount,
  referenceCount,
  showReferences,
  onToggleReferences,
  onOpenSidebar,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3 md:px-4">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-text-2"
          onClick={onOpenSidebar}
          aria-label={t('chat.sidebar.title')}
        >
          <Menu className="size-4.5" />
        </Button>
      )}

      {/* 会话标题 + 消息数 */}
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-[13.5px] font-medium text-text-1" title={sessionTitle}>
          {sessionTitle || t('chat.sidebar.unnamedSession')}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-text-4">{messagesCount}</span>
      </div>

      {/* 参考文档开关（含计数） */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'ml-auto h-7 gap-1.5 rounded-full border px-2.5 text-[11.5px]',
          showReferences
            ? 'border-primary/40 bg-primary-bg text-primary hover:bg-primary-bg'
            : 'border-border text-text-3 hover:text-text-2',
        )}
        onClick={onToggleReferences}
        disabled={referenceCount === 0 && !showReferences}
        aria-label={t('chat.toggleReferences')}
      >
        {showReferences ? <X className="size-3.5" /> : <PanelRight className="size-3.5" />}
        {t('chat.info.referenceDocs')}
        <span className="font-mono">{referenceCount}</span>
      </Button>
    </div>
  );
};

export default ChatTopBar;
