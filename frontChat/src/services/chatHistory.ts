import { ApiClient } from '../utils/axios';

const BASE_PATH = '/gateway/chat';

export interface Message {
  id: number;
  msg_id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
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
}

export interface GetSessionRes extends ChatSessionDetail {}

export interface DeleteSessionRes {
  id: string;
}

export const ChatHistoryService = {
  /**
   * 保存/同步会话
   */
  saveSession: async (data: SaveSessionReq): Promise<SaveSessionRes> => {
    return ApiClient.post<SaveSessionRes>(`${BASE_PATH}/session`, data);
  },

  /**
   * 获取历史会话列表
   */
  getHistory: async (): Promise<GetHistoryRes> => {
    return ApiClient.get<GetHistoryRes>(`${BASE_PATH}/history`);
  },

  /**
   * 获取单个会话详情
   */
  getSession: async (id: string): Promise<GetSessionRes> => {
    return ApiClient.get<GetSessionRes>(`${BASE_PATH}/session/${id}`);
  },

  /**
   * 删除会话
   */
  deleteSession: async (id: string): Promise<DeleteSessionRes> => {
    return ApiClient.delete<DeleteSessionRes>(`${BASE_PATH}/session/${id}`);
  },
};

export default ChatHistoryService;
