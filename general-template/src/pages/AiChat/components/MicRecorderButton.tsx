import React, { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, message } from 'antd';
import { AudioOutlined, StopOutlined, LoadingOutlined } from '@ant-design/icons';
import { MicVAD } from '@ricky0123/vad-web';
import ApiClient from '../../../utils/axios';
import { blobToDataURI } from '../../../services/asr';
import VoiceCallOverlay, { type CallStatus } from './VoiceCallOverlay';

interface MicRecorderButtonProps {
  onTranscript?: (text: string) => void;
  disabled?: boolean;
  language?: string; // e.g., 'auto' | 'zh' | 'en'
  size?: 'small' | 'middle' | 'large';
}

/**
 * 麦克风录音按钮：点击显示拨号叠层，叠层中使用 VAD 控制开始/结束录音，并将一次说话段打包为 WAV 上传后端，播放返回音频
 */
const MicRecorderButton: React.FC<MicRecorderButtonProps> = ({
  onTranscript,
  disabled,
  language = 'auto',
  size = 'middle',
}) => {
  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const durationTimerRef = useRef<number | null>(null);

  const vadRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const stoppedRef = useRef<boolean>(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
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
    };
  }, []);

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

  const startRecording = async () => {
    if (disabled || working) return;
    stoppedRef.current = false;
    fetchAbortRef.current = new AbortController();
    console.log(window.location.href);
    
    try {
      //使用VAD识别语音
      const vad = await MicVAD.new({
        onnxWASMBasePath: window.location.href+"node_modules/onnxruntime-web/dist/",
        baseAssetPath: window.location.href+"node_modules/@ricky0123/vad-web/dist/",
        positiveSpeechThreshold: 0.6,
        negativeSpeechThreshold: 0.35,
        minSpeechMs: 800,
        redemptionMs: 1600,
        onSpeechRealStart: () => {
          if (stoppedRef.current) return;
          setRecording(true);
          setHasStarted(true);
          setDurationSec(0);
          if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
          durationTimerRef.current = window.setInterval(() => { setDurationSec((s) => s + 1); }, 1000);
        },
        onSpeechStart: () => {},
        onSpeechEnd: async (audio: Float32Array) => {
          if (stoppedRef.current) return;
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
            message.success('AI 语音已播放');
          } catch (err: any) {
            if (err?.name === 'AbortError') {
              // 请求已被取消
            } else {
              console.error(err);
              message.error(err?.message || '上传或播放失败');
            }
          } finally {
            setWorking(false);
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
      vadRef.current = vad;
      await vad.start();
      setOverlayVisible(true);
      message.info('麦克风已打开，开始说话吧');
    } catch (err: any) {
      console.error(err);
      message.error('无法访问麦克风或初始化 VAD，请检查权限和资源路径');
    }
  };

  const stopRecording = async () => {
    stoppedRef.current = true;
    if (fetchAbortRef.current) { try { fetchAbortRef.current.abort(); } catch {} }
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} try { (audioRef.current as any).src = ''; } catch {} }
    if (audioUrlRef.current) { try { URL.revokeObjectURL(audioUrlRef.current); } catch {} audioUrlRef.current = null; }
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(t => { try { t.stop(); } catch {} }); } catch {}
      mediaStreamRef.current = null;
    }
    if (vadRef.current) {
      try { await vadRef.current.pause?.(); } catch {}
      try { await vadRef.current.destroy?.(); } catch (err) { console.error(err); }
      vadRef.current = null;
    }
    setRecording(false);
    setHasStarted(true);
    setOverlayVisible(false);
    if (durationTimerRef.current) { window.clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    message.info('通话已结束');
  };

  const icon = working ? <LoadingOutlined spin /> : recording ? <StopOutlined /> : <AudioOutlined />;
  const color = working ? '#1890ff' : recording ? '#ff4d4f' : '#444';
  const computeStatus = (): CallStatus => { if (!overlayVisible) return 'dialing'; if (working) return 'processing'; if (recording) return 'recording'; return hasStarted ? 'ended' : 'dialing'; };

  return (
    <>
      <Tooltip title={recording ? '停止录音' : '开始语音通话'}>
        <Button
          type="default"
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
            background: '#f5f5f5',
            border: '1px solid #e5e6eb',
            color,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
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
      />
    </>
  );
};

export default MicRecorderButton;
