/**
 * 会话侧栏（设计文档 4.1：220px，新建按钮 + 会话项标题/时间分组）
 * shadcn 版：分组列表 + AlertDialog 删除确认，逻辑沿用旧版（去重/排序/分组）
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import type { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentSessionId?: string;
  onCreateSession: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  /** 移动端抽屉内使用时关闭抽屉 */
  onSessionSelect?: () => void;
  className?: string;
}

/** 按更新时间分组：今天 / 昨天 / 具体日期 */
const useSessionGroups = (chatSessions: ChatSession[], t: (k: string) => string) =>
  useMemo(() => {
    const now = new Date();
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();
    // 按 id 去重，防止重复显示
    const uniqueSessions = chatSessions.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
    const sorted = [...uniqueSessions].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const bucket: Record<string, ChatSession[]> = {};
    for (const item of sorted) {
      const d = new Date(item.updatedAt);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString();
      const label =
        key === todayKey
          ? t('chat.sidebar.today')
          : key === yesterdayKey
            ? t('chat.sidebar.yesterday')
            : d.toLocaleDateString();
      (bucket[label] ||= []).push(item);
    }
    return Object.entries(bucket).map(([label, items]) => ({ label, items }));
  }, [chatSessions, t]);

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatSessions,
  currentSessionId,
  onCreateSession,
  onLoadSession,
  onDeleteSession,
  onSessionSelect,
  className,
}) => {
  const { t } = useTranslation();
  const groups = useSessionGroups(chatSessions, t);
  const [pendingDelete, setPendingDelete] = useState<ChatSession | null>(null);

  return (
    <div className={cn('flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-background', className)}>
      {/* 头部：标题 + 新建 */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[12.5px] font-medium text-text-2">{t('chat.sidebar.title')}</span>
        <Button
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onCreateSession}
        >
          <Plus className="size-3.5" />
          {t('chat.sidebar.newSession')}
        </Button>
      </div>

      {/* 会话分组列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-text-4">
            <MessageSquare className="size-6" />
            <span className="text-xs">{t('chat.noSession')}</span>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.label} className="mb-1.5">
            <div className="px-1.5 py-1.5 text-[11px] text-text-4">{group.label}</div>
            {group.items.map((item) => {
              const active = item.id === currentSessionId;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onLoadSession(item.id);
                    onSessionSelect?.();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onLoadSession(item.id);
                      onSessionSelect?.();
                    }
                  }}
                  className={cn(
                    'group mb-0.5 flex w-full cursor-pointer items-center justify-between gap-1.5 rounded-md border-l-2 px-2 py-2 transition-colors',
                    active
                      ? 'border-primary bg-primary-bg'
                      : 'border-transparent hover:bg-hover',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'truncate text-[13px] leading-5',
                        active ? 'font-medium text-text-1' : 'text-text-2',
                      )}
                      title={item.title || t('chat.sidebar.unnamedSession')}
                    >
                      {item.title || t('chat.sidebar.unnamedSession')}
                    </div>
                    <div className="text-[11px] text-text-4">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString() : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-text-4 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(item);
                    }}
                    aria-label={t('chat.sidebar.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 删除确认 */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chat.sidebar.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chat.sidebar.sessionTitle')}
              {pendingDelete?.title || t('chat.sidebar.unnamedSession')}
              <br />
              {t('chat.sidebar.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('chat.sidebar.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (pendingDelete) onDeleteSession(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              {t('chat.sidebar.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default React.memo(ChatSidebar);
