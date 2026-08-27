/**
 * assistant-ui 适配层（设计文档 6.2）
 * 通过 useExternalStoreRuntime 把 useChatSessions + useSSEChat 的状态
 * 映射为 assistant-ui 消息模型：
 * - 用户消息 → text part + 图片/文件附件 part
 * - AI 消息 → reasoning part（整块，不分片）+ text part
 * - 流式中合成 status=running 的 assistant 消息（reasoning / 正文实时更新）
 * - 发送链路：Composer submit → useChatComposer.sendQuestionByText（保持现有 SSE 参数）
 */

import { useCallback, useMemo } from 'react';
import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ImageMessagePart,
  type TextMessagePart,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import type { TFunction } from 'i18next';

import type { Message } from '@/types/chat';
import type { StageStep } from '../components/useSSEChat';
import { SSEConnectionState } from '@/utils/sse/sse';

type DataAttachmentPart = { type: 'data-attachment'; data: { name: string } };

/** Message → ThreadMessageLike（用户消息含附件 part） */
const convertMessage = (m: Message): ThreadMessageLike => {
  if (m.isUser) {
    const attachmentParts = (m.attachments ?? []).flatMap<ImageMessagePart | DataAttachmentPart>((a) => {
      if (a.type === 'image' && a.url) return [{ type: 'image' as const, image: a.url }];
      if (a.name) return [{ type: 'data-attachment' as const, data: { name: a.name } }];
      return [];
    });
    const textPart: TextMessagePart = { type: 'text', text: m.content };
    return {
      id: m.msg_id || m.id,
      role: 'user',
      content: [...attachmentParts, textPart],
      createdAt: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
    };
  }
  const parts: ({ type: 'reasoning'; text: string } | { type: 'text'; text: string })[] = [];
  if (m.reasoningContent) parts.push({ type: 'reasoning' as const, text: m.reasoningContent });
  parts.push({ type: 'text' as const, text: m.content });
  return {
    id: m.msg_id || m.id,
    role: 'assistant',
    content: parts,
    createdAt: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp),
  };
};

export interface UseChatRuntimeParams {
  messages: Message[];
  /** SSE 流式状态（useSSEChat） */
  isRunning: boolean;
  currentAiMessage: string;
  currentReasoningContent: string;
  /** 当前阶段（学习模式/多阶段推理会下发）——合并到思维链块展示，不再 UI 行单列 */
  stages: StageStep[];
  /** 发送入口：走 useChatComposer 的完整链路（附件上传 + SSE 参数完整保留） */
  onNewMessage: (text: string) => Promise<void> | void;
  onStop: () => void;
}

/** 从 AppendMessage 提取纯文本（text part 拼接） */
const extractText = (message: AppendMessage): string => {
  if (typeof message.content === 'string') return message.content;
  const parts = message.content as readonly { type: string; text?: string }[];
  if (!Array.isArray(parts)) return '';
  return parts.filter((p) => p.type === 'text').map((p) => p.text || '').join('');
};

/**
 * 组装 assistant-ui 外部存储 runtime。
 * 流式中在消息列表末尾合成一条 running 状态的 assistant 消息，
 * 其 reasoning / 正文 part 由 useSSEChat 的实时状态驱动。
 */
export const useChatRuntime = ({
  messages,
  isRunning,
  currentAiMessage,
  currentReasoningContent,
  stages,
  onNewMessage,
  onStop,
}: UseChatRuntimeParams) => {
  const converted = useMemo(
    () => messages.map(convertMessage),
    [messages],
  );

  /**
   * 流式合成消息：
   * - stages 通过 StageStreamingContext 单独传给 ReasoningBlock 内嵌流水线，
   *   不再混入 reasoning text——避免每次 stage 事件重写整段 reasoning 导致 smooth 打字机重播（卡顿根因）
   * - 只要 stages / reasoning / 正文 任一项出现就开始渲染消息气泡
   */
  const streamingMessage = useMemo<ThreadMessageLike | null>(() => {
    if (!isRunning) return null;
    const hasStage = stages.length > 0;
    const hasReasoning = !!currentReasoningContent;
    const hasContent = !!currentAiMessage;
    if (!hasStage && !hasReasoning && !hasContent) return null;

    const parts: ({ type: 'reasoning'; text: string } | { type: 'text'; text: string })[] = [];
    if (hasStage || hasReasoning) {
      // reasoning text 保持纯推理文字（有 stages 时 Context 已承载流水线 UI）
      parts.push({ type: 'reasoning' as const, text: currentReasoningContent });
    }
    if (hasContent) {
      parts.push({ type: 'text' as const, text: currentAiMessage });
    }
    return {
      id: 'streaming-assistant',
      role: 'assistant',
      content: parts,
      status: { type: 'running' },
    };
  }, [isRunning, currentAiMessage, currentReasoningContent, stages]);

  const runtimeMessages = useMemo(
    () => (streamingMessage ? [...converted, streamingMessage] : converted),
    [converted, streamingMessage],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      await onNewMessage(extractText(message));
    },
    [onNewMessage],
  );

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: runtimeMessages,
    convertMessage: (m: ThreadMessageLike) => m,
    onNew,
    onCancel: async () => onStop(),
  });

  return runtime;
};

export interface PipelineNodeView {
  key: string;
  label: string;
  status: 'done' | 'active' | 'error' | 'pending';
  elapsedMs?: number;
}

/**
 * 由 useSSEChat 的实时状态组装流水线节点（设计文档 4.1：理解问题 → 检索内容 → 生成回答 → 完成）
 * 后端下发 stages 事件时按真实阶段渲染，否则按固定阶段推断。
 */
export const buildPipelineNodes = (
  params: {
    stages: StageStep[];
    connectionState: SSEConnectionState;
    documentsCount: number;
    hasKnowledgeBase: boolean;
    hasContent: boolean;
  },
  t: TFunction,
): PipelineNodeView[] => {
  const { stages, connectionState, documentsCount, hasKnowledgeBase, hasContent } = params;
  const connecting =
    connectionState === SSEConnectionState.CONNECTING || connectionState === SSEConnectionState.RECONNECTING;
  const connected = connectionState === SSEConnectionState.CONNECTED;

  // 后端真实阶段（event: stage）
  if (stages.length > 0) {
    return stages.map((s) => ({
      key: `stage-${s.stage}`,
      label: s.label,
      status: s.status === 'start' ? ('active' as const) : s.status === 'error' ? ('error' as const) : ('done' as const),
      elapsedMs: s.status === 'end' ? s.elapsedMs : undefined,
    }));
  }

  // 固定阶段推断
  const nodes: PipelineNodeView[] = [
    {
      key: 'understand',
      label: t('chat.pipeline.understand'),
      status: connected ? 'done' : connecting ? 'active' : 'pending',
    },
  ];
  if (hasKnowledgeBase) {
    nodes.push({
      key: 'retrieve',
      label: documentsCount > 0 ? t('chat.pipeline.retrieved', { count: documentsCount }) : t('chat.pipeline.retrieve'),
      status: documentsCount > 0 ? 'done' : connected ? 'active' : 'pending',
    });
  }
  nodes.push({
    key: 'generate',
    label: t('chat.pipeline.generate'),
    status: hasContent ? 'active' : 'pending',
  });
  return nodes;
};
