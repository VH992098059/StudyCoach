/**
 * @fileoverview 语音通话叠层
 * @description 显示拨号/录音/处理中/结束的状态与对应图标，承载录音流程的 UI。
 */
import React, { useEffect } from 'react';
import { Modal, Button } from 'antd';
import { AudioOutlined, StopOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';

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
  const isDialing = status === 'dialing';
  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';
  const isEnded = status === 'ended';

  const title = isDialing
    ? '拨号中…'
    : isRecording
    ? '语音通话中'
    : isProcessing
    ? '处理中…'
    : '通话已结束';

  useEffect(() => {
    // 未来可加入铃声/提示音
  }, [status]);

  const icon = isProcessing ? (
    <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />
  ) : isRecording ? (
    <StopOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
  ) : isEnded ? (
    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
  ) : (
    <AudioOutlined style={{ fontSize: 24, color: '#666' }} />
  );

  return (
    <Modal
      open={visible}
      title={title}
      footer={null}
      onCancel={onCancel}
      centered
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
        }}>
          {icon}
        </div>
        {isRecording && (
          <div style={{ color: '#999' }}>{Math.floor(durationSec / 60)}:{String(durationSec % 60).padStart(2, '0')}</div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          {isDialing && (
            <Button type="primary" onClick={onStart}>开始通话</Button>
          )}
          {isRecording && (
            <Button danger onClick={onEnd}>结束通话</Button>
          )}
          {isProcessing && (
             <Button type="primary" onClick={onRestart}>重新对话</Button>
          )}
          {isEnded && (
            <Button type="primary" onClick={onRestart || onStart}>重新对话</Button>
          )}
          <Button onClick={onCancel}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
};

export default VoiceCallOverlay;