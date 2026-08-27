/**
 * 流式阶段上下文（学习模式/多阶段推理场景）
 *
 * 设计原因：早期将 stages 序列化为 JSON 塞进 reasoning text 前缀，导致每次 stage start/end 事件
 * 都会重写整个 reasoning text（虽然纯推理文本没变），assistant-ui 的 reasoning smooth 打字机
 * 会把整段 reasoning 当成新内容、从头平滑渲染，在 stages 频繁变化时表现为明显卡顿。
 *
 * 本 Context 在 ChatThread 层用最新 stages 包裹 AssistantRuntimeProvider 的内部组件，
 * ReasoningBlock 通过 useContext 读取 stages 并内嵌流水线视图；reasoning text 只承载真·推理文字，
 * 不再混入协议数据。
 */

import React, { createContext, useContext } from 'react';
import type { StageStep } from '@/pages/AiChat/components/useSSEChat';

interface StageStreamingContextValue {
  stages: StageStep[];
  /** 当前工具执行文案（与 pipelineNodes 同源），展示在思维链折叠块的流水线下方 */
  toolStatus?: string;
}

const StageStreamingContext = createContext<StageStreamingContextValue>({ stages: [] });

export const StageStreamingProvider: React.FC<
  React.PropsWithChildren<{ value: StageStreamingContextValue }>
> = ({ value, children }) => (
  <StageStreamingContext.Provider value={value}>{children}</StageStreamingContext.Provider>
);

export const useStageStreaming = (): StageStreamingContextValue =>
  useContext(StageStreamingContext);
