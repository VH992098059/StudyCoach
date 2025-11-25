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

/**
 * 知识库 API 服务
 */
export class KnowledgeBaseService {
  private static readonly BASE_PATH = '/gateway/v1/kb';

  /**
   * 创建知识库
   */
  static async create(data: KBCreateReq): Promise<KBCreateRes> {
    return ApiClient.post<KBCreateRes>(this.BASE_PATH, data);
  }

  /**
   * 更新知识库
   */
  static async update(data: KBUpdateReq): Promise<void> {
    const { id, ...updateData } = data;
    return ApiClient.put<void>(`${this.BASE_PATH}/${id}`, updateData);
  }

  /**
   * 删除知识库
   */
  static async delete(id: number): Promise<void> {
    return ApiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * 获取单个知识库
   */
  static async getOne(id: number): Promise<KnowledgeBase> {
    return ApiClient.get<KnowledgeBase>(`${this.BASE_PATH}/${id}`);
  }

  /**
   * 获取知识库列表
   */
  static async getList(params?: KBGetListReq): Promise<KBGetListRes> {
    return ApiClient.get<KBGetListRes>(this.BASE_PATH, params);
  }
}

export default KnowledgeBaseService;