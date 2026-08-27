/**
 * 消息组件（设计文档 4.1）
 * - 用户消息：右侧灰底气泡（图片/文件附件 + Markdown 正文）+ hover 操作栏（复制/编辑/重新生成）
 * - AI 消息：左侧 3px primary 色条 + 正文（思考折叠块 + Markdown）
 * - 内容列宽统一 max-w-[640px]，消息区左对齐
 *
 * 编辑链路：点击编辑 → 气泡替换为 textarea（预填原文，去除 markdown 行尾双空格）
 * → 提交调用 onTruncateAndSend（后端回滚 DB + LLM 历史，本地截断后以新文本重发并流式生成新回复）
 */

import React, { useState } from 'react';
import { MessagePrimitive, useAuiState, useMessagePartImage, useMessagePartData } from '@assistant-ui/react';
import { useTranslation } from 'react-i18next';
import { Copy, CornerDownLeft, FileText, Pencil, RefreshCw } from 'lucide-react';

import MarkdownText from './MarkdownText';
import ReasoningBlock from './ReasoningBlock';
import { useUserActions } from '../../context/UserActionsContext';

/** 用户消息附件：图片预览 */
const AttachmentImage: React.FC = () => {
  const part = useMessagePartImage();
  if (!part?.image) return null;
  return <img src={part.image} alt="" className="max-h-[280px] max-w-full rounded-md object-contain" />;
};

/** 用户消息附件：文件 chip */
const AttachmentFile: React.FC = () => {
  const part = useMessagePartData();
  const name = (part?.data as { name?: string } | undefined)?.name;
  if (!name) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-hover px-2.5 py-1.5 text-xs text-text-2">
      <FileText className="size-3.5 shrink-0 text-text-3" />
      <span className="min-w-0 truncate">{name}</span>
    </div>
  );
};

const joinTextParts = (s: { message: { content: readonly { type: string; text?: string }[] } }): string =>
  s.message.content
    .filter((p) => p.type === 'text')
    .map((p) => p.text ?? '')
    .join('');

/** 操作栏小图标按钮 */
const ActionBtn: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, disabled, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="rounded-md p-1 text-text-3 transition-colors hover:bg-hover hover:text-text-1 disabled:pointer-events-none disabled:opacity-40"
  >
    {children}
  </button>
);

/** 编辑态输入框：Enter 提交 / Shift+Enter 换行 / Esc 取消 */
const EditComposer: React.FC<{ draft: string; setDraft: (v: string) => void; onSubmit: () => void; onCancel: () => void }> = ({
  draft,
  setDraft,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  return (
    <div className="w-full rounded-lg border border-border bg-background p-2">
      <textarea
        autoFocus
        rows={2}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        className="max-h-40 min-h-[2.5rem] w-full resize-none bg-transparent px-1 py-0.5 text-sm leading-relaxed text-text-1 outline-none placeholder:text-text-3"
        placeholder={t('chat.input.placeholder')}
      />
      <div className="mt-1 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2.5 py-1 text-xs text-text-2 transition-colors hover:bg-hover hover:text-text-1"
        >
          {t('chat.actionCancel')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!draft.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          <CornerDownLeft className="size-3" />
          {t('chat.saveAndRegenerate')}
        </button>
      </div>
    </div>
  );
};

/** 用户消息底部操作栏：复制 / 编辑 / （仅最后一条）重新生成 */
const UserActionBar: React.FC<{ editing: boolean; onEdit: () => void; onCancelEdit: () => void }> = ({
  editing,
  onEdit,
  onCancelEdit,
}) => {
  const { t } = useTranslation();
  const { isRunning, lastUserMsgId, onCopy, onTruncateAndSend } = useUserActions();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const msgId = useAuiState((s: { message: { id: string } }) => s.message.id);
  const text = useAuiState(joinTextParts);
  const hasAttachment = useAuiState(
    (s: { message: { content: readonly { type: string }[] } }) => s.message.content.some((p) => p.type !== 'text'),
  );

  /** 提交编辑：截断重发；成功后本消息被移除、组件随之卸载 */
  const submitEdit = async () => {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onTruncateAndSend(msgId, draft);
    } finally {
      setSubmitting(false);
    }
  };

  if (editing) {
    return (
      <div className="w-full">
        <EditComposer draft={draft} setDraft={setDraft} onSubmit={submitEdit} onCancel={onCancelEdit} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 self-end opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-70">
      <ActionBtn label={t('chat.copy')} onClick={() => onCopy(text)} disabled={isRunning}>
        <Copy className="size-3.5" />
      </ActionBtn>
      {!hasAttachment && !isRunning && (
        <ActionBtn
          label={t('chat.editMessage')}
          onClick={() => {
            // 预填原文：去掉发送时为 markdown 换行追加的行尾双空格，便于直接改
            setDraft(text.replace(/[ \t]+\n/g, '\n'));
            onEdit();
          }}
        >
          <Pencil className="size-3.5" />
        </ActionBtn>
      )}
      {msgId === lastUserMsgId && !isRunning && (
        <ActionBtn label={t('chat.regenerate')} onClick={() => onTruncateAndSend(msgId, null)} disabled={isRunning}>
          <RefreshCw className="size-3.5" />
        </ActionBtn>
      )}
    </div>
  );
};

/** 用户消息：右侧灰底气泡 + hover 操作栏 */
export const UserMessage: React.FC = () => {
  const [editing, setEditing] = useState(false);
  return (
    <MessagePrimitive.Root className="group flex w-full justify-end">
      <div className="flex w-full max-w-[85%] flex-col items-end gap-1.5 md:max-w-[640px]">
        {editing ? null : (
          <MessagePrimitive.Parts
            components={{
              Image: AttachmentImage,
              data: { by_name: { attachment: AttachmentFile } },
              Text: MarkdownText,
            }}
          />
        )}
        <UserActionBar
          editing={editing}
          onEdit={() => setEditing(true)}
          onCancelEdit={() => setEditing(false)}
        />
      </div>
    </MessagePrimitive.Root>
  );
};

/** AI 消息：左侧 3px primary 色条 + 正文（思考折叠 + Markdown） */
export const AssistantMessage: React.FC = () => (
  <MessagePrimitive.Root className="w-full">
    <div className="flex max-w-[85%] flex-col gap-1.5 border-l-[3px] border-primary pl-3.5 md:max-w-[640px]">
      <MessagePrimitive.Parts
        components={{
          Reasoning: ReasoningBlock,
          Text: MarkdownText,
        }}
      />
    </div>
  </MessagePrimitive.Root>
);
