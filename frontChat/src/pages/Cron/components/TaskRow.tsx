/**
 * 任务行卡片（设计文档 4.4）
 * 启停开关 + 任务名 + 更新方式 pill（增量 primary / 全量 warning）
 * + 描述（关联知识库，单行截断）+ cron 表达式等宽胶囊 + 下次执行 + 编辑入口
 * 移动端（≤768px）wrap 为两行式：开关/名称/编辑一行，cron/下次执行一行右对齐
 */

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/common/StatusPill';
import { cn } from '@/lib/utils';
import { computeNextRunTime } from '../hooks/useCronState';
import type { CronTask } from '../types';

interface TaskRowProps {
  task: CronTask;
  selected: boolean;
  onToggleStatus: (id: string) => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  selected,
  onToggleStatus,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const enabled = task.status !== 0;
  const paused = task.status === 2;
  const nextRun = computeNextRunTime(
    { ...task.config, cronExpr: task.cronExpression },
    paused,
  );

  const nextRunText = !enabled
    ? t('cron.config.disabled')
    : paused
      ? t('cron.status.paused')
      : nextRun
        ? dayjs(nextRun).format('MM-DD HH:mm')
        : '—';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-surface transition-colors',
        selected ? 'border-primary' : 'border-border hover:border-border-strong',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(task.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(task.id);
          }
        }}
        className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-[11px]"
      >
        <Switch
          checked={enabled}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onToggleStatus(task.id)}
          aria-label={`${t('cron.actions.enable')} / ${t('cron.actions.disable')}`}
          className="order-1"
        />

        <div className="order-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'text-[13.5px] font-medium text-text-1',
                (paused || !enabled) && 'opacity-55',
              )}
            >
              {task.cronName}
            </span>
            <StatusPill tone={task.contentType === 2 ? 'primary' : 'warning'}>
              {task.contentType === 2 ? t('cron.config.incremental') : t('cron.config.full')}
            </StatusPill>
          </div>
          <div className="mt-0.5 truncate text-xs text-text-3">
            {t('cron.kb')}: {task.knowledgeBasename || t('cron.notSelected')}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="order-3 size-7 text-text-3 hover:text-text-1"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task.id);
          }}
          aria-label={t('common.edit')}
          title={t('common.edit')}
        >
          <Pencil className="size-3.5" />
        </Button>

        <span className="order-4 shrink-0 rounded-[3px] border border-border-strong px-2 py-[3px] font-mono text-[11.5px] text-text-2">
          {task.cronExpression}
        </span>

        <span className="order-5 ml-auto shrink-0 text-[11.5px] text-text-3">
          {t('cron.nextPrefix')}: {nextRunText}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          className="order-6 size-7 text-text-4 hover:text-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          aria-label={t('common.delete')}
          title={t('common.delete')}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default TaskRow;
