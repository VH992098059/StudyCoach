/**
 * 用户消息操作上下文（编辑 / 重新生成 / 复制）
 *
 * 链路：UserMessage 底部 hover 操作栏 → onTruncateAndSend(msgId, newText?)
 * → 调用后端 /gateway/chat/messages/truncate 回滚 DB 消息 + LLM 历史文件
 * → 本地截掉该条及之后的消息 → 以（新）文本走 sendQuestionByText 正常发送链路。
 * newText 传 null/undefined 表示重发原文（重新生成）。
 */

import React, { createContext, useContext } from 'react';

export interface UserActionsContextValue {
  /** SSE 流式进行中：操作全部禁用 */
  isRunning: boolean;
  /** 最后一条用户消息 ID：仅它显示"重新生成" */
  lastUserMsgId: string | null;
  onCopy: (text: string) => void;
  onTruncateAndSend: (msgId: string, newText?: string | null) => Promise<void>;
}

const UserActionsContext = createContext<UserActionsContextValue>({
  isRunning: false,
  lastUserMsgId: null,
  onCopy: () => {},
  onTruncateAndSend: async () => {},
});

export const UserActionsProvider: React.FC<
  React.PropsWithChildren<{ value: UserActionsContextValue }>
> = ({ value, children }) => (
  <UserActionsContext.Provider value={value}>{children}</UserActionsContext.Provider>
);

export const useUserActions = (): UserActionsContextValue => useContext(UserActionsContext);
