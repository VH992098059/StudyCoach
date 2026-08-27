/**
 * 消息区（设计文档 4.1）
 * ThreadPrimitive 组合：滚动 Viewport + 消息列表 + 空态 + 流水线图 + 回到底部按钮
 * 内容列宽 640px 左对齐；消息间距紧凑（14px）
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AssistantMessage, UserMessage } from './ChatMessages';
import PipelineGraph, { type PipelineNode } from '@/components/common/PipelineGraph';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { StageStreamingProvider } from '../../context/StageStreamingContext';
import type { StageStep } from '../useSSEChat';

export interface ChatThreadProps {
  isRunning: boolean;
  pipelineNodes: PipelineNode[];
  toolStatus: string;
  /** 当前原始阶段步骤（学习模式/多阶段推理下发），会传入思维链块内嵌流水线 */
  stages?: StageStep[];
}

const ChatThread: React.FC<ChatThreadProps> = ({
  isRunning,
  pipelineNodes,
  toolStatus,
  stages = [],
}) => {
  const { t } = useTranslation();
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 新一轮生成开始时恢复自动跟随，确保发送消息后能一直滚到 AI 回复处 */
  useEffect(() => {
    if (isRunning) setAutoScroll(true);
  }, [isRunning]);

  /**
   * 滚动处理：防抖 150ms 后按最终位置决定是否保持自动跟随。
   * 不能在 scroll 事件里立即关闭 autoScroll——程序化平滑滚动过程中会连续触发
   * scroll 且尚未贴底，立即置 false 会中断滚动，表现为“只滚到一半就停”。
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setAutoScroll(bottom < 80), 150);
  }, []);

  /**
   * 何时独立展示流水线：
   * - 流式进行中 + 有节点
   * - 且后端未下发 stages（即普通模式的 4 步推断流水线）
   * - 学习模式（stages 非空）通过 StageStreamingContext 内嵌到思维链折叠块，不在这里独占一行
   */
  const showInlinePipeline = isRunning && pipelineNodes.length > 0 && stages.length === 0;

  const stageContextValue = useMemo(
    () => ({ stages, toolStatus }),
    [stages, toolStatus],
  );

  return (
    <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
      <StageStreamingProvider value={stageContextValue}>
        <ThreadPrimitive.Viewport
          autoScroll={autoScroll}
          onScroll={handleScroll}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 md:px-6"
        >
          <ThreadPrimitive.Empty>
            <EmptyState
              icon={<MessageSquare />}
              title={t('chat.empty.title')}
              description={t('chat.empty.desc')}
              className="flex-1 justify-center py-20"
            />
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              AssistantMessage,
            }}
          />

          {/* 独立流水线：仅在未下发 stages 的普通模式（4 步推断）展示 */}
          {showInlinePipeline && (
            <div className="mt-1 max-w-[85%] md:max-w-[640px]">
              <PipelineGraph nodes={pipelineNodes} toolStatus={toolStatus} className="pl-0.5" />
            </div>
          )}
        </ThreadPrimitive.Viewport>

        {/* 回到底部 */}
        <ThreadPrimitive.ScrollToBottom asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-3 right-4 z-10 size-8 rounded-full shadow-sm"
            aria-label={t('chat.scrollToBottom')}
          >
            <ArrowDown className="size-4" />
          </Button>
        </ThreadPrimitive.ScrollToBottom>
      </StageStreamingProvider>
    </ThreadPrimitive.Root>
  );
};

export default ChatThread;
