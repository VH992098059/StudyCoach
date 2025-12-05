import { ApiClient } from '../utils/axios';

// 知识库状态枚举
export enum KBStatus {
  OK = 1,
  DISABLED = 2
}

// 知识库数据类型
export interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  category: string;
  status: KBStatus;
  createdAt?: string;
  updatedAt?: string;
}

// API 请求/响应类型
export interface KBCreateReq {
  name: string;
  description: string;
  category?: string;
}

export interface KBCreateRes {
  id: number;
}

export interface KBUpdateReq {
  id: number;
  name?: string;
  description?: string;
  category?: string;
  status?: KBStatus;
}

export interface KBGetListReq {
  name?: string;
  status?: KBStatus;
  category?: string;
}

export interface KBGetListRes {
  list: KnowledgeBase[];
}

const BASE_PATH = '/gateway/v1/kb';

/**
 * 知识库 API 服务
 */
export const KnowledgeBaseService = {
  /**
   * 创建知识库
   */
  create: async (data: KBCreateReq): Promise<KBCreateRes> => {
    return ApiClient.post<KBCreateRes>(BASE_PATH, data);
  },

  /**
   * 更新知识库
   */
  update: async (data: KBUpdateReq): Promise<void> => {
    const { id, ...updateData } = data;
    return ApiClient.put<void>(`${BASE_PATH}/${id}`, updateData);
  },

  /**
   * 删除知识库
   */
  delete: async (id: number): Promise<void> => {
    return ApiClient.delete<void>(`${BASE_PATH}/${id}`);
  },

  /**
   * 获取单个知识库
   */
  getOne: async (id: number): Promise<KnowledgeBase> => {
    return ApiClient.get<KnowledgeBase>(`${BASE_PATH}/${id}`);
  },

  /**
   * 获取知识库列表
   */
  getList: async (params?: KBGetListReq): Promise<KBGetListRes> => {
    return ApiClient.get<KBGetListRes>(BASE_PATH, params);
  }
};

export default KnowledgeBaseService;
