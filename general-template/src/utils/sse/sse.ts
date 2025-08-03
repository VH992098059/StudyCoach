/**
 * @fileoverview SSE (Server-Sent Events) 封装工具类
 * @description 提供SSE连接管理、事件监听、错误处理和自动重连等功能
 * @author 开发团队
 * @version 1.0.0
 */

/**
 * SSE事件数据接口
 */
export interface SSEEventData {
  /** 事件类型 */
  type?: string;
  /** 事件数据 */
  data: any;
  /** 事件ID */
  id?: string;
  /** 重试间隔 */
  retry?: number;
}

/**
 * SSE配置选项接口
 */
export interface SSEOptions {
  /** 是否启用自动重连 */
  autoReconnect?: boolean;
  /** 重连间隔时间（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 连接超时时间（毫秒） */
  timeout?: number;
  /** 请求方法 */
  method?: 'GET' | 'POST';
  /** POST请求体 */
  body?: FormData | string | Record<string, any>;
  /** API基础URL */
  baseURL?: string;
}

/**
 * SSE事件监听器类型
 */
export type SSEEventListener = (data: SSEEventData) => void;

/**
 * SSE连接状态枚举
 */
export enum SSEConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

/**
 * SSE封装类
 * @description 提供完整的SSE连接管理功能
 * @example
 * ```typescript
 * const sse = new SSEClient('http://localhost:8000/api/sse', {
 *   autoReconnect: true,
 *   reconnectInterval: 3000,
 *   maxReconnectAttempts: 5
 * });
 * 
 * sse.addEventListener('message', (data) => {
 *   console.log('收到消息:', data);
 * });
 * 
 * sse.connect();
 * ```
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private abortController: AbortController | null = null;
  private url: string;
  private options: Required<SSEOptions>;
  private eventListeners: Map<string, Set<SSEEventListener>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private connectionState: SSEConnectionState = SSEConnectionState.DISCONNECTED;

  /**
   * 构造函数
   * @param url SSE服务端点URL
   * @param options 配置选项
   */
  constructor(url: string, options: SSEOptions = {}) {
    this.url = url;
    this.options = {
      autoReconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      headers: {},
      timeout: 30000,
      method: 'GET',
      body: undefined,
      baseURL: process.env.NODE_ENV === 'production' ? '/api/gateway/chat ' : 'http://localhost:8000/gateway',
      ...options
    };
  }

  /**
   * 建立SSE连接
   * @description 创建EventSource实例或fetch流并设置事件监听器
   */
  public connect(): void {
    if ((this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) || 
        (this.abortController && !this.abortController.signal.aborted)) {
      console.warn('SSE连接已存在，无需重复连接');
      return;
    }

    this.setConnectionState(SSEConnectionState.CONNECTING);

    // 构建完整URL
    const fullUrl = this.options.baseURL ? `${this.options.baseURL}${this.url}` : this.url;

    try {
      // 如果是POST请求或有body，使用fetch流
      if (this.options.method === 'POST' || this.options.body) {
        this.connectWithFetch(fullUrl);
      } else {
        // 使用传统的EventSource
        this.connectWithEventSource(fullUrl);
      }
    } catch (error) {
      console.error('创建SSE连接失败:', error);
      this.setConnectionState(SSEConnectionState.ERROR);
      this.emitEvent('error', { type: 'error', data: error });
    }
  }

  /**
   * 使用fetch建立SSE连接（支持POST和FormData）
   */
  private async connectWithFetch(url: string): Promise<void> {
    try {
      this.abortController = new AbortController();

      const requestInit: RequestInit = {
        method: this.options.method,
        signal: this.abortController.signal,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.options.headers
        }
      };

      // 处理请求体
      if (this.options.body) {
        if (this.options.body instanceof FormData) {
          requestInit.body = this.options.body;
          // FormData会自动设置Content-Type
        } else if (typeof this.options.body === 'string') {
          requestInit.body = this.options.body;
          requestInit.headers = {
            ...requestInit.headers,
            'Content-Type': 'text/plain'
          };
        } else {
          requestInit.body = JSON.stringify(this.options.body);
          requestInit.headers = {
            ...requestInit.headers,
            'Content-Type': 'application/json'
          };
        }
      }

      const response = await fetch(url, requestInit);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 连接成功
      this.setConnectionState(SSEConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.emitEvent('open', { type: 'open', data: response });

      // 处理流数据
      await this.processStream(response);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('SSE连接被中止');
        return;
      }
      
      console.error('Fetch SSE连接错误:', error);
      this.setConnectionState(SSEConnectionState.ERROR);
      this.emitEvent('error', { type: 'error', data: error });

      // 自动重连逻辑
      if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * 处理流数据
   */
  private async processStream(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.emitEvent('message', { type: 'message', data: '[DONE]' });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 按行分割，但保留不完整的行
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

        for (const line of lines) {
          this.processSSELine(line);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 处理SSE行数据
   */
  private processSSELine(line: string): void {
    if (line.startsWith('data:')) {
      const data = line.slice(5); // 移除 'data:' 前缀
      if (data === '[DONE]') {
        this.emitEvent('message', { type: 'message', data: '[DONE]' });
      } else if (data.trim()) {
        try {
          // 尝试解析JSON数据
          const jsonData = JSON.parse(data.trim());
          if (jsonData.content) {
            // 如果是包含content字段的JSON，提取content
            this.emitEvent('message', { type: 'message', data: jsonData.content });
          } else {
            // 否则发送原始JSON数据
            this.emitEvent('message', { type: 'message', data: data.trim() });
          }
        } catch (error) {
          // 如果不是JSON格式，直接发送原始数据
          this.emitEvent('message', { type: 'message', data: data.trim() });
        }
      }
    } else if (line.startsWith('documents:')) {
      // 处理文档数据
      const data = line.slice(10); // 移除 'documents:' 前缀
      try {
        const jsonData = JSON.parse(data.trim());
        this.emitEvent('documents', { type: 'documents', data: jsonData });
      } catch (error) {
        console.warn('解析documents数据失败:', error);
      }
    } else if (line.startsWith('event: error')) {
      // 处理错误事件
      this.emitEvent('error', { type: 'error', data: { message: '服务器错误' } });
    } else if (line.trim() && !line.startsWith(':')) {
      // 处理没有前缀的行
      if (line.trim() === '[DONE]') {
        this.emitEvent('message', { type: 'message', data: '[DONE]' });
      } else if (line.trim()) {
        this.emitEvent('message', { type: 'message', data: line.trim() });
      }
    }
  }

  /**
   * 使用EventSource建立SSE连接（传统GET方式）
   */
  private connectWithEventSource(url: string): void {
    // 创建EventSource实例
    this.eventSource = new EventSource(url);

    // 设置连接打开事件
    this.eventSource.onopen = (event) => {
      console.log('SSE连接已建立');
      this.setConnectionState(SSEConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.clearReconnectTimer();
      this.emitEvent('open', { type: 'open', data: event });
    };

    // 设置消息接收事件
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emitEvent('message', {
          type: 'message',
          data,
          id: event.lastEventId
        });
      } catch (error) {
        // 如果不是JSON格式，直接传递原始数据
        this.emitEvent('message', {
          type: 'message',
          data: event.data,
          id: event.lastEventId
        });
      }
    };

    // 设置错误处理事件
    this.eventSource.onerror = (event) => {
      console.error('SSE连接错误:', event);
      this.setConnectionState(SSEConnectionState.ERROR);
      this.emitEvent('error', { type: 'error', data: event });

      // 自动重连逻辑
      if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    // 设置连接超时
    setTimeout(() => {
      if (this.connectionState === SSEConnectionState.CONNECTING) {
        console.warn('SSE连接超时');
        this.disconnect();
        this.emitEvent('timeout', { type: 'timeout', data: '连接超时' });
      }
    }, this.options.timeout);
  }

  /**
   * 断开SSE连接
   * @description 关闭EventSource连接并清理资源
   */
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.clearReconnectTimer();
    this.setConnectionState(SSEConnectionState.DISCONNECTED);
    this.emitEvent('close', { type: 'close', data: '连接已关闭' });
    console.log('SSE连接已断开');
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  public addEventListener(eventType: string, listener: SSEEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  public removeEventListener(eventType: string, listener: SSEEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }

  /**
   * 移除所有事件监听器
   * @param eventType 可选，指定事件类型，不指定则移除所有
   */
  public removeAllEventListeners(eventType?: string): void {
    if (eventType) {
      this.eventListeners.delete(eventType);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * 获取当前连接状态
   * @returns 连接状态
   */
  public getConnectionState(): SSEConnectionState {
    return this.connectionState;
  }

  /**
   * 检查是否已连接
   * @returns 是否已连接
   */
  public isConnected(): boolean {
    return this.connectionState === SSEConnectionState.CONNECTED;
  }

  /**
   * 手动重连
   * @description 断开当前连接并重新建立连接
   */
  public reconnect(): void {
    console.log('手动重连SSE');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  /**
   * 设置连接状态
   * @param state 新的连接状态
   */
  private setConnectionState(state: SSEConnectionState): void {
    const oldState = this.connectionState;
    this.connectionState = state;
    
    if (oldState !== state) {
      this.emitEvent('stateChange', {
        type: 'stateChange',
        data: { oldState, newState: state }
      });
    }
  }

  /**
   * 触发事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  private emitEvent(eventType: string, data: SSEEventData): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`事件监听器执行错误 [${eventType}]:`, error);
        }
      });
    }
  }

  /**
   * 安排重连
   * @description 设置重连定时器
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState(SSEConnectionState.RECONNECTING);
    
    console.log(`准备第 ${this.reconnectAttempts} 次重连，${this.options.reconnectInterval}ms 后执行`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.options.reconnectInterval);
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 销毁实例
   * @description 清理所有资源，断开连接
   */
  public destroy(): void {
    this.disconnect();
    this.removeAllEventListeners();
    this.reconnectAttempts = 0;
  }
}

/**
 * 创建SSE客户端实例的工厂函数
 * @param url SSE服务端点URL
 * @param options 配置选项
 * @returns SSE客户端实例
 */
export function createSSEClient(url: string, options?: SSEOptions): SSEClient {
  return new SSEClient(url, options);
}

/**
 * SSE工具函数集合
 */
export const SSEUtils = {
  /**
   * 检查浏览器是否支持SSE
   * @returns 是否支持SSE
   */
  isSupported(): boolean {
    return typeof EventSource !== 'undefined';
  },

  /**
   * 格式化SSE URL
   * @param baseUrl 基础URL
   * @param params 查询参数
   * @returns 格式化后的URL
   */
  formatUrl(baseUrl: string, params?: Record<string, string>): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  },

  /**
   * 解析SSE事件数据
   * @param rawData 原始数据
   * @returns 解析后的数据
   */
  parseEventData(rawData: string): any {
    try {
      return JSON.parse(rawData);
    } catch {
      return rawData;
    }
  }
};

/**
 * 业务相关的SSE连接方法
 */
export const SSEBusiness = {
  /**
   * AI面试助手聊天 - 支持FormData和字符串消息
   * @param messageOrFormData 消息内容或FormData
   * @param chatId 聊天ID（可选）
   * @param options 额外配置选项
   * @returns SSE客户端实例
   */
  chatWithLoveApp(
    messageOrFormData: string | FormData, 
    chatId?: string, 
    options: SSEOptions = {}
  ): SSEClient {
    const defaultOptions: SSEOptions = {
      autoReconnect: false, // 聊天通常不需要自动重连
      timeout: 60000,
      ...options
    };

    if (messageOrFormData instanceof FormData) {
      // 使用FormData的POST请求
      return new SSEClient('/ai/interview_app/chat/sse', {
        ...defaultOptions,
        method: 'POST',
        body: messageOrFormData
      });
    } else {
      // 使用查询参数的GET请求（向后兼容）
      const params = new URLSearchParams();
      params.set('message', messageOrFormData);
      if (chatId) {
        params.set('chatId', chatId);
      }
      
      return new SSEClient(`/ai/interview_app/chat/sse?${params.toString()}`, defaultOptions);
    }
  },

  /**
   * AI超级智能体聊天
   * @param message 消息内容
   * @param options 额外配置选项
   * @returns SSE客户端实例
   */
  chatWithManus(message: string, options: SSEOptions = {}): SSEClient {
    const params = new URLSearchParams();
    params.set('message', message);
    
    const defaultOptions: SSEOptions = {
      autoReconnect: false,
      timeout: 60000,
      ...options
    };

    return new SSEClient(`/ai/manus/chat?${params.toString()}`, defaultOptions);
  },

  /**
   * 通用聊天方法 - 支持更灵活的配置
   * @param endpoint API端点
   * @param data 数据（可以是FormData、对象或字符串）
   * @param options 配置选项
   * @returns SSE客户端实例
   */
  createChatClient(
    endpoint: string, 
    data: FormData | Record<string, any> | string, 
    options: SSEOptions = {}
  ): SSEClient {
    const defaultOptions: SSEOptions = {
      autoReconnect: false,
      timeout: 60000,
      ...options
    };

    if (data instanceof FormData) {
      return new SSEClient(endpoint, {
        ...defaultOptions,
        method: 'POST',
        body: data
      });
    } else if (typeof data === 'object') {
      return new SSEClient(endpoint, {
        ...defaultOptions,
        method: 'POST',
        body: data
      });
    } else {
      // 字符串数据作为查询参数
      const params = new URLSearchParams();
      params.set('message', data);
      return new SSEClient(`${endpoint}?${params.toString()}`, defaultOptions);
    }
  }
};

/**
 * 兼容性方法 - 模拟index.js中的函数签名
 */

/**
 * 连接SSE（支持FormData）- 兼容index.js
 * @param url 端点URL
 * @param formData FormData对象
 * @returns 模拟的EventSource对象
 */
export function connectSSEWithFormData(url: string, formData: FormData) {
  const client = new SSEClient(url, {
    method: 'POST',
    body: formData,
    autoReconnect: false
  });

  // 模拟EventSource接口
  const mockEventSource = {
    onmessage: null as ((event: { data: string }) => void) | null,
    onerror: null as ((error: any) => void) | null,
    close: () => client.disconnect()
  };

  // 设置事件监听
  client.addEventListener('message', (data) => {
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({ data: data.data });
    }
  });

  client.addEventListener('error', (data) => {
    if (mockEventSource.onerror) {
      mockEventSource.onerror(data.data);
    }
  });

  // 自动连接
  client.connect();

  return mockEventSource;
}

/**
 * 连接SSE（传统方式）- 兼容index.js
 * @param url 端点URL
 * @param params 查询参数
 * @param onMessage 消息回调
 * @param onError 错误回调
 * @returns EventSource实例
 */
export function connectSSE(
  url: string, 
  params: Record<string, string>, 
  onMessage?: (data: string) => void, 
  onError?: (error: any) => void
) {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const client = new SSEClient(`${url}?${queryString}`, {
    autoReconnect: false
  });

  if (onMessage) {
    client.addEventListener('message', (data) => {
      onMessage(data.data);
    });
  }

  if (onError) {
    client.addEventListener('error', (data) => {
      onError(data.data);
    });
  }

  client.connect();

  // 返回一个模拟的EventSource对象
  return {
    close: () => client.disconnect(),
    readyState: client.isConnected() ? 1 : 0
  };
}

/**
 * AI面试助手聊天 - 兼容index.js
 */
export function chatWithLoveApp(formData: FormData | string, chatId?: string) {
  return SSEBusiness.chatWithLoveApp(formData, chatId);
}

/**
 * AI超级智能体聊天 - 兼容index.js
 */
export function chatWithManus(message: string) {
  return SSEBusiness.chatWithManus(message);
}

// 默认导出
export default {
  SSEClient,
  SSEBusiness,
  SSEUtils,
  connectSSEWithFormData,
  connectSSE,
  chatWithLoveApp,
  chatWithManus,
  createSSEClient
};