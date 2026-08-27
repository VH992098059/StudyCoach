/**
 * 输入区（设计文档 4.1）
 * - 输入行：附件按钮 + 知识库选择 chip + 输入框 + 语音按钮 + 发送/停止按钮
 * - 开关行：深度思考 / 联网 / 学习模式 三个 pill 开关 + 快捷键提示
 * - 单层边框；上下 padding 压缩（10px/14px）；开关行紧贴输入框（6px）允许换行
 */

import React, { useRef } from 'react';
import { ComposerPrimitive } from '@assistant-ui/react';
import { useTranslation } from 'react-i18next';
import { Globe, GraduationCap, Loader2, Paperclip, SendHorizontal, Square, Brain } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import KnowledgeSelector from '@/components/KnowledgeSelector';
import MicRecorderButton from './MicRecorderButton';
import FileUpload, { type FileUploadRef } from './FileUpload';
import type { UploadedFile } from '@/types/chat';
import { cn } from '@/lib/utils';

export interface ChatComposerProps {
  isRunning: boolean;
  sessionId?: string;
  /** 知识库 */
  selectedKnowledge: string;
  onKnowledgeChange: (id: string) => void;
  /** 模式开关（useChatSettings） */
  isNetworkEnabled: boolean;
  isStudyMode: boolean;
  isDeepThinking: boolean;
  onToggleNetwork: () => void;
  onToggleStudyMode: () => void;
  onToggleDeepThinking: () => void;
  /** 附件 */
  fileUploadRef: React.RefObject<FileUploadRef | null>;
  currentUploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onUploadComplete: (files: UploadedFile[]) => void;
  /** 语音转写 → 直接发送 */
  onVoiceTranscript: (text: string) => void;
}

/** 模式开关 pill：选中 primary 底色，未选中描边 */
const ModePill: React.FC<{
  active: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, disabled, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-[11.5px] transition-colors',
      active
        ? 'border-primary bg-primary-bg text-primary'
        : 'border-border text-text-2 hover:border-border-strong hover:text-text-1',
      disabled && 'cursor-not-allowed opacity-45',
    )}
  >
    {icon}
    {label}
  </button>
);

const ChatComposer: React.FC<ChatComposerProps> = ({
  isRunning,
  sessionId,
  selectedKnowledge,
  onKnowledgeChange,
  isNetworkEnabled,
  isStudyMode,
  isDeepThinking,
  onToggleNetwork,
  onToggleStudyMode,
  onToggleDeepThinking,
  fileUploadRef,
  currentUploadedFiles,
  onFilesChange,
  onUploadComplete,
  onVoiceTranscript,
}) => {
  const { t } = useTranslation();
  const composerRef = useRef<HTMLDivElement>(null);

  return (
    <ComposerPrimitive.Root className="w-full px-4 pb-3 md:px-6">
      {/* 附件列表 */}
      <FileUpload
        ref={fileUploadRef}
        sessionId={sessionId}
        onFilesChange={onFilesChange}
        onUploadComplete={onUploadComplete}
        disabled={isRunning}
        autoUpload
      />

      {/* 输入行：单层边框 */}
      <div className="flex items-end gap-1.5 rounded-md border border-border bg-surface px-2.5 py-[10px] transition-colors focus-within:border-primary">
        {/* 附件按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-text-2 hover:text-text-1"
              onClick={() => fileUploadRef.current?.triggerFileSelect()}
              disabled={isRunning || currentUploadedFiles.length >= 5}
              aria-label={t('chat.upload.select')}
            >
              <Paperclip className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('chat.upload.select')}</TooltipContent>
        </Tooltip>

        {/* 知识库选择 chip：融入输入行（无边框），hover 才显示边界 */}
        <div className="w-[136px] shrink-0 max-[520px]:hidden" ref={composerRef}>
          <KnowledgeSelector
            value={selectedKnowledge}
            onChange={onKnowledgeChange}
            triggerClassName="h-9 border-transparent bg-transparent px-2.5 shadow-none hover:border-border dark:bg-transparent dark:hover:bg-transparent"
          />
        </div>

        {/* 输入框：无额外边框（单层）；最多约 4 行高度，超过自动垂直滚动 */}
        <ComposerPrimitive.Input
          placeholder={t('chat.input.placeholder')}
          submitMode="enter"
          rows={1}
          className="max-h-[104px] min-h-[36px] flex-1 resize-none overflow-y-auto bg-transparent px-1 py-1.5 text-[14px] leading-relaxed text-text-1 outline-none placeholder:text-text-4"
        />

        {/* 语音按钮 */}
        <MicRecorderButton disabled={isRunning} language="auto" onTranscript={onVoiceTranscript} />

        {/* 发送 / 停止 */}
        {isRunning ? (
          <ComposerPrimitive.Cancel asChild>
            <Button variant="outline" size="icon" className="shrink-0" aria-label={t('chat.input.stop')}>
              <Square className="size-3.5 fill-current" />
            </Button>
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send asChild>
            <Button
              size="icon"
              className="shrink-0"
              aria-label={t('chat.input.send')}
            >
              <SendHorizontal className="size-4" />
            </Button>
          </ComposerPrimitive.Send>
        )}
      </div>

      {/* 开关行：三 pill + 快捷键提示 */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1">
        <ModePill
          active={isDeepThinking}
          disabled={isStudyMode}
          icon={<Brain className="size-3.5" />}
          label={t('chat.input.deepThinking')}
          onClick={onToggleDeepThinking}
        />
        <ModePill
          active={isNetworkEnabled}
          icon={<Globe className="size-3.5" />}
          label={t('chat.input.networkEnabled')}
          onClick={onToggleNetwork}
        />
        <ModePill
          active={isStudyMode}
          icon={<GraduationCap className="size-3.5" />}
          label={t('chat.input.studyMode')}
          onClick={onToggleStudyMode}
        />
        <span className="ml-auto hidden text-[11px] text-text-4 sm:inline">
          {t('chat.input.shortcutHint')}
        </span>
        {isRunning && (
          <span className="flex items-center gap-1 text-[11px] text-text-3 sm:hidden">
            <Loader2 className="size-3 animate-spin" />
          </span>
        )}
      </div>
    </ComposerPrimitive.Root>
  );
};

export default ChatComposer;
