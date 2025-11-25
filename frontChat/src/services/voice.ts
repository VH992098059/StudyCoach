import { message } from 'antd';
import ApiClient from '../utils/axios';

/**
 * 语音服务状态接口
 */
export interface VoiceState {
  isReading: boolean;
  currentReadingMsgId: string | null;
  isLoading: boolean;
  loadingMsgId: string | null;
}

/**
 * 语音服务回调接口
 */
export interface VoiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onLoadStart: (msgId: string) => void;
  onCanPlay: () => void;
  onEnded: () => void;
  onError: (error: any) => void;
  onAbort: () => void;
}

/**
 * 语音服务类
 */
export class VoiceService {
  private audioCache: Map<string, string> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private isReading: boolean = false;
  private currentReadingMsgId: string | null = null;
  private isLoading: boolean = false;
  private loadingMsgId: string | null = null;
  private callbacks: VoiceCallbacks | null = null;

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 获取当前状态
   */
  getState(): VoiceState {
    return {
      isReading: this.isReading,
      currentReadingMsgId: this.currentReadingMsgId,
      isLoading: this.isLoading,
      loadingMsgId: this.loadingMsgId
    };
  }

  /**
   * 更新状态并通知回调
   */
  private updateState(isReading: boolean, currentReadingMsgId: string | null, isLoading?: boolean, loadingMsgId?: string | null) {
    this.isReading = isReading;
    this.currentReadingMsgId = currentReadingMsgId;
    
    if (isLoading !== undefined) {
      this.isLoading = isLoading;
    }
    if (loadingMsgId !== undefined) {
      this.loadingMsgId = loadingMsgId;
    }
    
    if (this.callbacks) {
      this.callbacks.onStateChange({
        isReading,
        currentReadingMsgId,
        isLoading: this.isLoading,
        loadingMsgId: this.loadingMsgId
      });
    }
  }

  /**
   * 处理文本内容，移除Markdown语法
   */
  private processTextForReading(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
      .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/^\s*[-*+]\s+/gm, '• ') // 替换列表标记为点号
      .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
      .replace(/\n{2,}/g, '。 ') // 将换行替换为句号和空格
      .replace(/\s+/g, ' ') // 合并多余空格
      .trim();
  }

  /**
   * 调用语音合成API
   */
  private async callTextToSpeechAPI(text: string): Promise<string> {
    try {
      // 使用统一 ApiClient 的 postBlob（内部基于 fetch 规避 XHR blob 兼容问题）
      const audioBlob: Blob = await ApiClient.postBlob(
        '/gateway/tts',
        { input: text },
        { showError: true }
      );

      // 检查blob大小
      if (audioBlob.size === 0) {
        throw new Error('接收到空的音频数据');
      }

      // 创建音频URL
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (error) {
      console.error('语音合成API调用失败:', error);
      throw error;
    }
  }

  /**
   * 播放音频
   */
  private playAudio(audioUrl: string, msgId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      // 设置音频属性
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      // 设置事件监听器
      audio.onloadstart = () => {
        this.updateState(true, msgId);
        if (this.callbacks) {
          this.callbacks.onLoadStart(msgId);
        }
      };

      audio.oncanplay = () => {
        if (this.callbacks) {
          this.callbacks.onCanPlay();
        }
        message.success('开始朗读');
      };

      audio.onended = () => {
        this.updateState(false, null);
        this.currentAudio = null;
        if (this.callbacks) {
          this.callbacks.onEnded();
        }
        message.info('朗读完成');
        resolve();
      };

      audio.onerror = (event) => {
        console.error('音频播放出错:', event);
        this.updateState(false, null);
        this.currentAudio = null;
        if (this.callbacks) {
          this.callbacks.onError(event);
        }
        message.error('音频播放失败');
        reject(new Error('音频播放失败'));
      };

      audio.onabort = () => {
        this.updateState(false, null);
        this.currentAudio = null;
        if (this.callbacks) {
          this.callbacks.onAbort();
        }
        resolve();
      };

      // 保存音频引用并开始播放
      this.currentAudio = audio;
      
      audio.play().catch(playError => {
        console.error('音频播放失败:', playError);
        this.updateState(false, null);
        this.currentAudio = null;
        if (this.callbacks) {
          this.callbacks.onError(playError);
        }
        message.error('音频播放失败，可能需要用户交互后才能播放');
        reject(playError);
      });
    });
  }

  /**
   * 朗读消息内容
   */
  async readMessage(msgId: string, content: string): Promise<void> {
    // 如果正在朗读同一条消息，则停止朗读
    if (this.isReading && this.currentReadingMsgId === msgId) {
      this.stopReading();
      return;
    }

    // 如果正在朗读其他消息，先停止
    if (this.isReading) {
      this.stopReading();
    }

    try {
      // 浏览器语音合成为可选备用方案，不阻断服务端 TTS

      // 处理文本内容
      const textToRead = this.processTextForReading(content);

      if (!textToRead) {
        message.warning('没有可朗读的内容');
        return;
      }

      // 检查缓存
      let audioUrl = this.audioCache.get(textToRead);
      
      if (audioUrl) {
        // 使用缓存的音频
        console.log('使用缓存的音频');
        await this.playAudio(audioUrl, msgId);
      } else {
        // 设置加载状态
        this.updateState(false, null, true, msgId);
        
        try {
          // 调用API获取音频
          console.log('调用API获取音频');
          audioUrl = await this.callTextToSpeechAPI(textToRead);
          
          // 存储到缓存
          this.audioCache.set(textToRead, audioUrl);
          
          // 清除加载状态，开始播放
          this.updateState(false, null, false, null);
          
          // 播放音频
          await this.playAudio(audioUrl, msgId);
        } catch (apiError) {
          // API调用失败时清除加载状态
          this.updateState(false, null, false, null);
          throw apiError;
        }
      }
    } catch (error) {
      console.error('朗读失败:', error);
      // 清除所有状态
      this.updateState(false, null, false, null);
      
      if (error instanceof Error) {
        if (error.message.includes('网络') || error.message.includes('HTTP')) {
          message.error('网络连接失败，请检查网络后重试');
        } else if (error.message.includes('音频')) {
          message.error('音频处理失败，请稍后重试');
        } else {
          message.error('朗读失败，请稍后重试');
        }
      } else {
        message.error('朗读失败，请稍后重试');
      }
    }
  }

  /**
   * 停止朗读
   */
  stopReading(): void {
    const wasReading = this.isReading || !!this.currentAudio || ('speechSynthesis' in window && (window as any).speechSynthesis?.speaking);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // 停止浏览器语音合成（如果有的话）
    if ('speechSynthesis' in window && (window as any).speechSynthesis?.speaking) {
      (window as any).speechSynthesis.cancel();
    }

    // 清除所有状态
    this.updateState(false, null, false, null);
    if (wasReading) {
      message.info('已停止朗读');
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    // 释放所有缓存的音频URL
    for (const url of this.audioCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.audioCache.clear();
    console.log('音频缓存已清理');
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopReading();
    this.clearCache();
    this.callbacks = null;
  }
}

// 创建单例实例
export const voiceService = new VoiceService();