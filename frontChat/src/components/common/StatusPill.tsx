import React from 'react';
import { cn } from '@/lib/utils';

export type PillTone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral' | 'mono';

const toneClasses: Record<PillTone, string> = {
  primary: 'bg-primary-bg text-primary',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  neutral: 'bg-hover text-text-2',
  mono: 'bg-hover text-text-2 font-mono',
};

export interface StatusPillProps {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * 状态胶囊（设计文档 3.4）
 * 已就绪 primary / 索引中 warning / 失败 danger / 分数 mono 等宽
 */
export function StatusPill({ tone, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-[3px] px-1.5 py-0.5 text-[11.5px] leading-4 font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
