import ApiClient from '../utils/axios';

export interface AsrResponse {
  result?: {
    raw_text?: string;
    clean_text?: string;
    text?: string;
  };
  raw_text?: string; // 某些实现可能直接返回在顶层
  clean_text?: string;
  text?: string;
}

/**
 * 将 Blob 转为 dataURI(Base64)
 */
export const blobToDataURI = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('无法转换为Base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 将任意音频 Blob 转为 WAV 的 dataURI(Base64)
 * - 通过 AudioContext 解码为 PCM，再重采样到 16kHz 单声道，并封装为 WAV
 */
export const blobToWavDataURI = async (blob: Blob, targetSampleRate: number = 16000): Promise<string> => {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioCtx();
  const audioBuffer: AudioBuffer = await new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      arrayBuffer,
      (buf) => resolve(buf),
      (err) => reject(err)
    );
  });

  const sourceChannel = audioBuffer.getChannelData(0); // 取第一声道，转单声道
  const inputSampleRate = audioBuffer.sampleRate;
  const resampled = resampleFloat32(sourceChannel, inputSampleRate, targetSampleRate);
  const wavView = encodeWAV(resampled, targetSampleRate, 1);
  const u8 = new Uint8Array(wavView.buffer);
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  const wavBlob = new Blob([ab], { type: 'audio/wav' });
  return blobToDataURI(wavBlob);
};

/**
 * 简单重采样（下采样）到目标采样率
 */
const resampleFloat32 = (input: Float32Array, inputRate: number, targetRate: number): Float32Array => {
  if (inputRate === targetRate) return input;
  const ratio = inputRate / targetRate;
  const newLength = Math.round(input.length / ratio);
  const output = new Float32Array(newLength);
  let pos = 0;
  for (let i = 0; i < newLength; i++) {
    output[i] = input[Math.floor(pos)] || 0;
    pos += ratio;
  }
  return output;
};

/**
 * 将 Float32 PCM 编码为 16-bit PCM WAV
 */
const encodeWAV = (samples: Float32Array, sampleRate: number, numChannels: number): DataView => {
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 写入样本（Float32 -> Int16）
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return view;
};

const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

/**
 * 发送 Base64 音频到后端进行识别
 * @param audioBase64 dataURI 或纯Base64，后端均支持
 * @param language 语言标识，默认 auto
 */
export async function transcribeBase64(audioBase64: string, language: string = 'auto'): Promise<AsrResponse> {
  return ApiClient.post('/gateway/asr', {
    audio_base64: audioBase64,
    language,
  }, { showError: true });
}

/**
 * 便捷方法：将 Blob 直接发送识别（转换为 WAV 再上传）
 */
export async function transcribeBlob(blob: Blob, language: string = 'auto'): Promise<AsrResponse> {
  // 将浏览器录制的 webm/ogg 转为标准的 wav，再上传
  const dataURI = await blobToWavDataURI(blob, 16000);
  return transcribeBase64(dataURI, language);
}

/**
 * 从响应中提取最干净的文本
 */
export function pickText(resp: AsrResponse): string {
  if (!resp) return '';
  const fromResult = resp.result || {};
  return (
    resp.clean_text || resp.text || resp.raw_text ||
    fromResult.clean_text || fromResult.text || fromResult.raw_text ||
    ''
  );
}

// 新增：将 PCM 直接封装为 WAV Blob
export const pcmToWavBlob = (samples: Float32Array, sampleRate: number = 16000, numChannels: number = 1): Blob => {
  const wavView = encodeWAV(samples, sampleRate, numChannels);
  const u8 = new Uint8Array(wavView.buffer);
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return new Blob([ab], { type: 'audio/wav' });
};

// 新增：上传 WAV（Base64）并获取后端返回的音频 Blob
export async function uploadWavBlobAndGetAudio(blob: Blob, language: string = 'auto'): Promise<Blob> {
  const dataURI = await blobToDataURI(blob);
  return ApiClient.postBlob('/gateway/asr', {
    audio_base64: dataURI,
    language,
  });
}

// 新增：直接上传 PCM 并获取音频 Blob
export async function uploadPCMAndGetAudio(samples: Float32Array, sampleRate: number = 16000, language: string = 'auto'): Promise<Blob> {
  const wavBlob = pcmToWavBlob(samples, sampleRate, 1);
  return uploadWavBlobAndGetAudio(wavBlob, language);
}

const asrService = { transcribeBase64, transcribeBlob, pickText };
export default asrService;