import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * 空态组件（替代 antd Empty，设计文档 5.2）
 * 图标位 + 标题 + 可选描述与引导操作
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      {icon && <div className="text-text-4 [&_svg]:size-9 [&_svg]:stroke-1">{icon}</div>}
      <div className="text-[13px] font-medium text-text-2">{title}</div>
      {description && <div className="max-w-xs text-xs leading-relaxed text-text-3">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
