/**
 * 处理流水线（设计文档 3.4 / 4.1，地铁线路图风格）
 * 10px 圆点 + 2px 线段；done 实心 primary / active 空心 + 脉冲环 / pending 灰
 * 数据来源：useSSEChat 的 stages / currentToolStatus / documentsCount / connectionState
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface PipelineNode {
  key: string;
  label: string;
  status: 'done' | 'active' | 'error' | 'pending';
  /** 完成耗时（ms），完成后展示 */
  elapsedMs?: number;
}

export interface PipelineGraphProps {
  nodes: PipelineNode[];
  /** 当前执行中的工具提示（如"正在执行工具：xxx"），展示在流水线底部 */
  toolStatus?: string;
  className?: string;
}

/** 单个节点圆点：done 实心 / active 空心+脉冲环 / error 实心红 / pending 灰 */
const NodeDot: React.FC<{ status: PipelineNode['status'] }> = ({ status }) => (
  <span className="relative flex size-[10px] shrink-0 items-center justify-center">
    {status === 'active' && (
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
    )}
    <span
      className={cn(
        'relative inline-flex size-[10px] rounded-full border-2 transition-colors',
        status === 'done' && 'border-primary bg-primary',
        status === 'active' && 'border-primary bg-surface',
        status === 'error' && 'border-danger bg-danger',
        status === 'pending' && 'border-border-strong bg-surface',
      )}
    />
  </span>
);

const PipelineGraph: React.FC<PipelineGraphProps> = ({ nodes, toolStatus, className }) => {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col', className)} aria-label={t('chat.pipeline.title')}>
      {nodes.map((node, i) => (
        <div key={node.key} className="flex min-h-7 items-stretch gap-2.5">
          {/* 左列：圆点 + 连接线 */}
          <div className="flex w-[10px] shrink-0 flex-col items-center">
            <NodeDot status={node.status} />
            {i < nodes.length - 1 && (
              <span
                className={cn(
                  'my-0.5 w-0.5 flex-1 transition-colors',
                  node.status === 'done' ? 'bg-primary' : 'bg-border-strong',
                )}
              />
            )}
          </div>
          {/* 右列：标签 + 耗时 */}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 pb-1.5">
            <span
              className={cn(
                'text-[13px] leading-7',
                node.status === 'pending' && 'text-text-4',
                node.status === 'done' && 'text-text-2',
                node.status === 'active' && 'font-medium text-text-1',
                node.status === 'error' && 'text-danger',
              )}
            >
              {node.label}
            </span>
            {node.status === 'done' && !!node.elapsedMs && (
              <span className="font-mono text-[11px] text-text-4">{node.elapsedMs}ms</span>
            )}
            {node.status === 'error' && (
              <span className="text-[11px] text-danger">{t('chat.pipeline.failed')}</span>
            )}
          </div>
        </div>
      ))}
      {toolStatus && (
        <div className="mt-1 flex items-center gap-1.5 pl-[20px] text-[12px] text-text-3">
          <span className="size-1 shrink-0 animate-pulse rounded-full bg-primary" />
          <span className="min-w-0 truncate">{toolStatus}</span>
        </div>
      )}
    </div>
  );
};

export default PipelineGraph;
