import { ApiClient } from '../utils/axios';

const BASE_PATH = '/gateway/chat';

export interface Message {
  id: string;
  msg_id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  reasoningContent?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: Message[];
}

export interface SaveSessionReq {
  id: string;
  title?: string;
  messages: Message[];
}

export interface SaveSessionRes {
  id: string;
}

export interface GetHistoryRes {
  list: ChatSession[];
  total: number;
  page: number;
  page_size: number;
}

export type GetSessionRes = ChatSessionDetail;

export interface DeleteSessionRes {
  id: string;
}

export interface UploadChatFileRes {
  file_names: string[];
}

export interface TruncateMessagesReq {
  session_id: string;
  /** LLM 历史保留前 N 条消息（0 表示截到空，用于编辑首条消息） */
  keep_count: number;
  /** 删除 DB 中该毫秒时间戳及之后的消息；0 表示不删 DB 仅截历史文件 */
  before_timestamp?: number;
}

export interface TruncateMessagesRes {
  deleted_messages: number;
  kept_lines: number;
}

export const ChatHistoryService = {
  /**
   * 上传聊天附件到会话工作目录
   */
  uploadFiles: async (sessionId: string, files: File[]): Promise<UploadChatFileRes> => {
    const formData = new FormData();
    formData.append('id', sessionId);
    files.forEach((f) => formData.append('files', f));
    return ApiClient.post<UploadChatFileRes>(`${BASE_PATH}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * 保存/同步会话
   */
  saveSession: async (data: SaveSessionReq): Promise<SaveSessionRes> => {
    return ApiClient.post<SaveSessionRes>(`${BASE_PATH}/session`, data);
  },

  /**
   * 获取历史会话列表
   */
  getHistory: async (page = 1, page_size = 20): Promise<GetHistoryRes> => {
    return ApiClient.get<GetHistoryRes>(`${BASE_PATH}/history`, {
      params: { page, page_size }
    });
  },

  /**
   * 获取单个会话详情
   */
  getSession: async (id: string, before_timestamp = 0, limit = 20): Promise<GetSessionRes> => {
    return ApiClient.get<GetSessionRes>(`${BASE_PATH}/session/${id}`, {
      params: { before_timestamp, limit }
    });
  },

  /**
   * 删除会话
   */
  deleteSession: async (id: string): Promise<DeleteSessionRes> => {
    return ApiClient.delete<DeleteSessionRes>(`${BASE_PATH}/session/${id}`);
  },

  /**
   * 截断会话消息（编辑重发 / 重新生成时回滚 DB 与 LLM 历史）
   */
  truncateMessages: async (data: TruncateMessagesReq): Promise<TruncateMessagesRes> => {
    return ApiClient.post<TruncateMessagesRes>(`${BASE_PATH}/messages/truncate`, data);
  },
};

export default ChatHistoryService;
