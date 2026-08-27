/**
 * @fileoverview 语音通话叠层
 * @description 显示拨号/录音/处理中/结束的状态与对应图标，承载录音流程的 UI。
 */
import React from 'react';
import { AudioLines, Square, Loader2, CircleCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CallStatus = 'dialing' | 'recording' | 'processing' | 'ended';

interface VoiceCallOverlayProps {
  visible: boolean;
  status: CallStatus;
  durationSec?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onCancel?: () => void;
  onRestart?: () => void;
}

const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({
  visible,
  status,
  durationSec = 0,
  onStart,
  onEnd,
  onCancel,
  onRestart,
}) => {
  const { t } = useTranslation();
  const isDialing = status === 'dialing';
  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';
  const isEnded = status === 'ended';

  const title = isDialing
    ? t('chat.voice.dialing')
    : isRecording
    ? t('chat.voice.inCall')
    : isProcessing
    ? t('chat.voice.processing')
    : t('chat.voice.ended');

  const icon = isProcessing ? (
    <Loader2 className="size-6 animate-spin text-primary" />
  ) : isRecording ? (
    <Square className="size-6 fill-current text-danger" />
  ) : isEnded ? (
    <CircleCheck className="size-6 text-success" />
  ) : (
    <AudioLines className="size-6 text-text-3" />
  );

  return (
    <Dialog open={visible} onOpenChange={(open) => { if (!open) onCancel?.(); }}>
      <DialogContent className="max-w-xs" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-2">
          <div
            className={cn(
              'flex size-16 items-center justify-center rounded-lg border bg-surface',
              isRecording && 'animate-pulse border-danger/40',
            )}
          >
            {icon}
          </div>
          <div className="text-sm font-medium text-text-2">{title}</div>
          {isRecording && (
            <div className="font-mono text-sm text-text-3">
              {Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}
            </div>
          )}
          <div className="flex gap-3">
            {isDialing && (
              <Button onClick={onStart}>{t('chat.voice.startBtn')}</Button>
            )}
            {isRecording && (
              <Button variant="destructive" onClick={onEnd}>{t('chat.voice.endBtn')}</Button>
            )}
            {(isProcessing || isEnded) && (
              <Button onClick={onRestart || onStart}>{t('chat.voice.restartBtn')}</Button>
            )}
            <Button variant="outline" onClick={onCancel}>{t('chat.voice.closeBtn')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCallOverlay;
