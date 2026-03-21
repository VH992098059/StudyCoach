/**
 * @fileoverview 麦克风录音按钮
 * @description 集成 VAD 语音端点检测，录制一次说话段并生成 WAV 上传，
 * 支持返回音频播放与将文本转写回调到父组件。
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { AudioOutlined, StopOutlined, LoadingOutlined, PhoneOutlined } from '@ant-design/icons';
import { MicVAD } from '@ricky0123/vad-web';
import ApiClient from '@/utils/axios';
import { blobToDataURI } from '@/services/asr';
import VoiceCallOverlay, { type CallStatus } from './VoiceCallOverlay';
import { useTranslation } from 'react-i18next';

interface MicRecorderButtonProps {
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  language?: string; // e.g., 'auto' | 'zh' | 'en'
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  type?: 'primary' | 'ghost' | 'dashed' | 'link' | 'text' | 'default';
}

/**
 * 麦克风录音按钮：点击显示拨号叠层，叠层中使用 VAD 控制开始/结束录音，并将一次说话段打包为 WAV 上传后端，播放返回音频
 */
const MicRecorderButton: React.FC<MicRecorderButtonProps> = ({
  onTranscript,
  disabled,
  language = 'auto',
  size = 'middle',
  style,
  type = 'default',
}) => {
  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const durationTimerRef = useRef<number | null>(null);
  const { t } = useTranslation();
  const vadRef = useRef<any>(null);
  // vadInitPromise: 预热期间保存的初始化 Promise，startRecording 时可直接 await
  const vadInitPromiseRef = useRef<Promise<any> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const stoppedRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  /** 供 VAD 回调内调用，避免 buildVAD 早于 stopRecording 声明 */
  const stopRecordingRef = useRef<() => Promise<void>>(async () => {});
  /** 单次通话最长连续录音时间（秒），超时自动结束，防止无限占用麦克风与超大上传 */
  const maxDurationTimerRef = useRef<number | null>(null);
  const MAX_RECORD_SEC = 60;
  
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';

    if (audioRef.current) {
      audioRef.current.onended = () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
    }

    return () => {
      try { vadRef.current?.pause?.(); } catch {}
      try { vadRef.current?.destroy?.(); } catch {}
      vadRef.current = null;
      vadInitPromiseRef.current = null;
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {}
        mediaStreamRef.current = null;
      }
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        window.clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }
    };
  }, []);

  // 叠层打开时预热 VAD 模型（加载 ONNX 模型约 0.5-2s），使用户点击「开始」时无需等待
  useEffect(() => {
    if (overlayVisible && !vadRef.current && !vadInitPromiseRef.current) {
      vadInitPromiseRef.current = buildVAD().catch(() => { vadInitPromiseRef.current = null; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayVisible]);

  // 将 Float32Array 封装为 WAV Blob（16kHz/单声道/16-bit PCM）
  const float32ToWavBlob = (samples: Float32Array, sampleRate: number = 16000): Blob => {
    const bytesPerSample = 2;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample * 1, true);
    view.setUint16(32, bytesPerSample * 1, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  };

  // 构建 VAD 实例（不启动），用于预热和重用
  const buildVAD = async () => {
    // WASM/模型文件由 vite.config.ts 的 copyVadAssetsPlugin 复制到 public/vad/
    const vadBase = `${import.meta.env.BASE_URL}vad/`
    const vad = await MicVAD.new({
      onnxWASMBasePath: vadBase,
      baseAssetPath: vadBase,
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.45,
      minSpeechMs: 1000,
      redemptionMs: 3000,
      onSpeechRealStart: () => {
        if (stoppedRef.current) return;
        setRecording(true);
        setHasStarted(true);
        setDurationSec(0);
        if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = window.setInterval(() => { setDurationSec((s) => s + 1); }, 1000);
        if (maxDurationTimerRef.current) {
          window.clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }
        maxDurationTimerRef.current = window.setTimeout(() => {
          message.warning(t('chat.voice.maxDuration'));
          void stopRecordingRef.current();
        }, MAX_RECORD_SEC * 1000);
      },
      onSpeechStart: () => {
        // 说话开始：如果正在处理上一段，中断上一次请求（barge-in）
        if (stoppedRef.current) return;
        if (processingRef.current && fetchAbortRef.current) {
          fetchAbortRef.current.abort();
          fetchAbortRef.current = new AbortController();
          processingRef.current = false;
          setWorking(false);
        }
      },
      onSpeechEnd: async (audio: Float32Array) => {
        if (stoppedRef.current) return;
        if (maxDurationTimerRef.current) {
          window.clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }
        // barge-in 场景下 processingRef 已被重置，此处可以正常处理
        processingRef.current = true;
        if (!fetchAbortRef.current) fetchAbortRef.current = new AbortController();
        if (durationTimerRef.current) {
          window.clearInterval(durationTimerRef.current);
          durationTimerRef.current = null;
        }
        setRecording(false);
        setWorking(true);
        try {
          const wavBlob = float32ToWavBlob(audio, 16000);
          const dataURI = await blobToDataURI(wavBlob);
          const respBlob = await ApiClient.postBlob('/gateway/asr', { audio_base64: dataURI, language }, { showLoading: true, signal: fetchAbortRef.current?.signal });
          const url = URL.createObjectURL(respBlob);
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = url;
          if (!audioRef.current) audioRef.current = new Audio();
          audioRef.current.src = url;
          await audioRef.current.play();
          message.success(t('chat.voice.played'));
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            // 请求被 barge-in 或手动取消，静默处理
          } else {
            console.error(err);
            message.error(err?.message || t('chat.voice.failed'));
          }
        } finally {
          setWorking(false);
          processingRef.current = false;
        }
      },
      getStream: async () => {
        if (mediaStreamRef.current) return mediaStreamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, autoGainControl: true, noiseSuppression: true },
        });
        mediaStreamRef.current = stream;
        return stream;
      },
    });
    return vad;
  };

  const startRecording = async () => {
    if (disabled || working) return;
    stoppedRef.current = false;
    fetchAbortRef.current = new AbortController();

    try {
      let vad = vadRef.current;
      if (!vad) {
        // 优先等待预热完成的实例，否则临时构建
        vad = vadInitPromiseRef.current ? await vadInitPromiseRef.current : await buildVAD();
        vadInitPromiseRef.current = null;
        vadRef.current = vad;
      }
      await vad.start();
      setOverlayVisible(true);
      message.info(t('chat.voice.micStarted'));
    } catch (err: any) {
      console.error(err);
      message.error(t('chat.voice.micError'));
    }
  };

  const stopRecording = async () => {
    stoppedRef.current = true;
    if (maxDurationTimerRef.current) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (fetchAbortRef.current) { try { fetchAbortRef.current.abort(); } catch {} fetchAbortRef.current = null; }
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} try { (audioRef.current as any).src = ''; } catch {} }
    if (audioUrlRef.current) { try { URL.revokeObjectURL(audioUrlRef.current); } catch {} audioUrlRef.current = null; }
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {}
      mediaStreamRef.current = null;
    }
    // pause 而非 destroy，保留 VAD 实例供下次 start() 快速复用
    if (vadRef.current) {
      try { await vadRef.current.pause?.(); } catch (err) { console.error(err); }
    }
    setRecording(false);
    setWorking(false);
    processingRef.current = false;
    setOverlayVisible(false);
    if (durationTimerRef.current) { window.clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    message.info(t('chat.voice.ended'));
  };

  // 中断当前处理/播放并重新开始录音（手动打断）
  const resetAndStart = async () => {
    if (maxDurationTimerRef.current) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current.currentTime = 0;
    }
    if (audioUrlRef.current) {
      try { URL.revokeObjectURL(audioUrlRef.current); } catch {}
      audioUrlRef.current = null;
    }
    if (fetchAbortRef.current) {
      try { fetchAbortRef.current.abort(); } catch {}
      fetchAbortRef.current = null;
    }
    processingRef.current = false;
    setWorking(false);
    // VAD 实例保留，直接 pause 后 start 复用
    if (vadRef.current) {
      try { await vadRef.current.pause?.(); } catch {}
    }
    stoppedRef.current = false;
    startRecording();
  };

  stopRecordingRef.current = stopRecording;

  const icon = working ? <LoadingOutlined spin /> : recording ? <StopOutlined /> : <PhoneOutlined />;
  const color = working ? '#1890ff' : recording ? '#ff4d4f' : '#444';
  const computeStatus = (): CallStatus => { if (!overlayVisible) return 'dialing'; if (working) return 'processing'; if (recording) return 'recording'; return hasStarted ? 'ended' : 'dialing'; };

  return (
    <>
      <Tooltip title={recording ? t('chat.voice.stopRecord') : t('chat.voice.startCall')}>
        <Button
          icon={icon}
          onClick={() => {
            // 点击按钮仅打开叠层，真正的开始在叠层中触发
            setOverlayVisible(true);
          }}
          disabled={disabled || working}
          size={size}
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            borderRadius: 8,
            // Only apply default background/border if type is default to avoid clashing with text buttons
            background: type === 'default' ? '#f5f5f5' : 'transparent',
            border: type === 'default' ? '1px solid #e5e6eb' : 'none',
            color,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            ...style,
          }}
        />
      </Tooltip>

      <VoiceCallOverlay
        visible={overlayVisible}
        status={computeStatus()}
        durationSec={durationSec}
        onStart={startRecording}
        onEnd={stopRecording}
        onCancel={() => { stopRecording(); }}
        onRestart={resetAndStart}
      />
    </>
  );
};

export default MicRecorderButton;
