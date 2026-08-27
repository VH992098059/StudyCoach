import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeadProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * 页面头（标题 + 描述 + 就近操作区）
 * 操作按钮放标题行右侧（功能元素就近原则，设计文档 3.1）
 */
export function PageHead({ title, description, actions, className }: PageHeadProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-text-1">{title}</h1>
        {description && <p className="mt-1 text-[12.5px] text-text-3">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
