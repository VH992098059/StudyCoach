/**
 * 思考内容折叠块（设计文档 3.4）
 * - 默认折叠，"展开思考过程"按钮 + 箭头旋转；展开后灰色块 + 左侧 2px 竖线
 * - 学习模式/多阶段推理：stages 通过 StageStreamingContext 注入，内嵌为思维链骨架（地铁风流水线），
 *   再渲染 reasoning 纯文本（如果有），保证「生成回答」在思维链下完成
 * - 流式进行中默认展开，完成后收起（历史记录随消息持久化恢复）
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMessagePartReasoning } from '@assistant-ui/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import PipelineGraph, { type PipelineNode } from '@/components/common/PipelineGraph';
import { useStageStreaming } from '../../context/StageStreamingContext';
import type { StageStep } from '../useSSEChat';

const stageStepToPipeline = (s: StageStep): PipelineNode => ({
  key: s.stage,
  label: s.label,
  status: s.status === 'start' ? 'active' : s.status === 'error' ? 'error' : s.status === 'end' ? 'done' : 'pending',
  elapsedMs: s.elapsedMs,
});

const ReasoningBlock: React.FC = () => {
  const { t } = useTranslation();
  const part = useMessagePartReasoning();
  const reasoningText = part?.text ?? '';
  const { stages } = useStageStreaming();
  const isRunning = part?.status?.type === 'running';
  const [expanded, setExpanded] = useState(isRunning);

  const hasNodes = stages.length > 0;
  const hasText = !!reasoningText;
  if (!hasNodes && !hasText) return null;

  // 标题：有阶段→"处理流程"，纯推理→"思考过程"
  const title = hasNodes
    ? (hasText ? t('chat.thinkChain.processWithThinking') : t('chat.thinkChain.viewProcess'))
    : (expanded ? t('chat.thinkChain.hideThinking') : t('chat.thinkChain.viewThinking'));

  const stageNodes = useMemo(() => stages.map(stageStepToPipeline), [stages]);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex h-6 w-fit cursor-pointer items-center gap-1 rounded-sm px-1 text-xs text-text-3 transition-colors hover:text-text-2"
      >
        <span>{title}</span>
        <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="border-l-2 border-border-strong bg-hover py-2.5 pl-3 pr-3.5">
          {hasNodes && (
            <div className="mb-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-text-4">
                <span className={cn('size-1.5 rounded-full', isRunning ? 'animate-pulse bg-primary' : 'bg-text-4')} />
                {t('chat.thinkChain.pipeline')}
              </div>
              <PipelineGraph nodes={stageNodes} />
            </div>
          )}
          {hasText && (
            <>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] text-text-4">
                <span className="size-1.5 rounded-full bg-text-4" />
                {t('chat.thinkChain.thinking')}
              </div>
              <div className="whitespace-pre-wrap text-[12.5px] leading-[1.7] text-text-3">{reasoningText}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReasoningBlock;
