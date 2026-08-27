/**
 * @fileoverview 轻量 fetch SSE 客户端（替代 @ant-design/x-sdk 的 XRequest）
 * @description POST JSON + 流式读取 text/event-stream，解析为 SSEChunk 对象。
 *
 * 解析规则（与后端 common/stream.go 的写入格式对齐）：
 * - 事件以空行（\n\n）分隔；行内以首个冒号切分 key/value
 * - 以冒号开头的注释行直接跳过
 * - event 字段去除一个前导空格（后端写 "event: stage"）
 * - data/documents 等其余字段保留原样：后端写 "data:"+内容 且内容本身
 *   可能以空格开头（LLM 增量 delta 常见 " world"），贸然 trim 会丢字符
 * - 同一事件内重复 key 按 SSE 规范以换行拼接
 *
 * 行为对齐 XRequest：
 * - 非 2xx 响应抛 Fetch failed with status {status}
 * - abort() 触发 onError(Error{ name: 'AbortError' })
 * - application/json 响应整包回调 onUpdate + onSuccess
 */

/** SSE 事件解析结果：{ event, data, documents, ... }，值均为原始字符串 */
export type SSEChunk = Record<string, string>;

export interface SSEClientCallbacks<T extends object = SSEChunk> {
  onUpdate?: (chunk: T, headers: Headers) => void;
  onSuccess?: (chunks: T[], headers: Headers) => void;
  onError?: (error: Error) => void;
}

export interface SSEClientOptions<T extends object = SSEChunk> {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  callbacks?: SSEClientCallbacks<T>;
}

export interface SSEClient {
  run: () => void;
  abort: () => void;
}

/** 解析单个事件文本为 SSEChunk（解析失败的字段静默忽略） */
const parsePart = (part: string): SSEChunk | null => {
  const chunk: SSEChunk = {};
  for (const line of part.split('\n')) {
    if (line.startsWith(':')) continue; // 注释行
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    let value = line.slice(idx + 1);
    if (key === 'event' && value.startsWith(' ')) value = value.slice(1);
    chunk[key] = key in chunk ? `${chunk[key]}\n${value}` : value;
  }
  return Object.keys(chunk).length > 0 ? chunk : null;
};

export function createSSEClient<T extends object = SSEChunk>(
  url: string,
  options: SSEClientOptions<T> = {},
): SSEClient {
  const { headers = {}, params = {}, callbacks } = options;
  const abortController = new AbortController();

  const run = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(params),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      if (!response.body) {
        throw new Error('The response body is empty.');
      }

      const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim();

      // 非流式 JSON 响应：整包回调
      if (mimeType === 'application/json') {
        const chunk = (await response.json()) as T;
        callbacks?.onUpdate?.(chunk, response.headers);
        callbacks?.onSuccess?.([chunk], response.headers);
        return;
      }

      // SSE 流式解析
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      const chunks: T[] = [];
      let buffer = '';

      const processPart = (part: string) => {
        const chunk = parsePart(part);
        if (!chunk) return;
        chunks.push(chunk as T);
        callbacks?.onUpdate?.(chunk as T, response.headers);
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          if (part.trim() !== '') processPart(part);
        }
      }
      buffer += decoder.decode();
      if (buffer.trim() !== '') processPart(buffer);

      callbacks?.onSuccess?.(chunks, response.headers);
    } catch (error) {
      // abort() 抛出 DOMException(AbortError)，保持与 XRequest 一致的错误形态
      const err =
        error instanceof Error || error instanceof DOMException
          ? (error as Error)
          : new Error('Unknown error!');
      callbacks?.onError?.(err);
    }
  };

  return {
    run: () => {
      void run();
    },
    abort: () => {
      abortController.abort();
    },
  };
}
