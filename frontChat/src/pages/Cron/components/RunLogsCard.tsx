/**
 * 运行日志卡片（左列任务列表正下方，设计文档 4.4）
 * 执行记录等宽行：时间戳 / 任务名 / 结果文案（含耗时）；成功绿 / 失败红；
 * 失败行带"查看详情"入口（错误详情 Dialog）；条目超出时卡片内部滚动
 */

import React from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { LogEntry } from '../types';

interface RunLogsCardProps {
  logs: LogEntry[];
  loading?: boolean;
  onShowDetail: (content?: string) => void;
}

const formatDuration = (ms?: number): string | null => {
  if (!ms || ms <= 0) return null;
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
};

const RunLogsCard: React.FC<RunLogsCardProps> = ({ logs, loading, onShowDetail }) => {
  const { t } = useTranslation();

  const sortedLogs = [...logs].sort((a, b) => b.time - a.time);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[12.5px] font-medium text-text-1">
          {t('cron.logs.recordsTitle')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1.5 py-0.5 text-xs text-primary hover:text-primary"
          onClick={() => onShowDetail(undefined)}
        >
          {t('cron.logs.viewAll')}
        </Button>
      </div>

      {/* 条目多时卡片内部滚动，页面不产生全局滚动条 */}
      <div className="max-h-[264px] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center text-xs text-text-3">
            {t('common.loading')}
          </div>
        ) : sortedLogs.length === 0 ? (
          <EmptyState
            title={t('cron.logs.empty')}
            className="px-4 py-6"
          />
        ) : (
          sortedLogs.map((log) => (
            <div
              key={log.id}
              className={cn(
                'flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-row-border px-4 py-0.5 font-mono text-[11.5px] leading-[1.8] last:border-b-0',
                log.status === 'failed' ? 'text-danger' : log.status === 'success' ? 'text-success' : 'text-text-2',
              )}
            >
              <span className="shrink-0 text-text-4">
                {dayjs(log.time).format('MM-DD HH:mm:ss')}
              </span>
              {log.cronName && (
                <span className="shrink-0 text-primary">[{log.cronName}]</span>
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 [overflow-wrap:anywhere]',
                  log.status === 'failed'
                    ? 'text-danger'
                    : log.status === 'success'
                      ? 'text-success'
                      : 'text-text-2',
                )}
              >
                {log.status === 'failed'
                  ? t('cron.logs.resultFailed')
                  : log.status === 'running'
                    ? t('cron.status.running')
                    : t('cron.logs.resultSuccess')}
                {formatDuration(log.durationMs) ? ` (${formatDuration(log.durationMs)})` : ''}
              </span>
              {log.status === 'failed' && (
                <button
                  type="button"
                  className="shrink-0 cursor-pointer bg-transparent p-0 font-mono text-[11.5px] text-primary hover:underline"
                  onClick={() => onShowDetail(log.detail)}
                >
                  {t('cron.logs.details')}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RunLogsCard;
