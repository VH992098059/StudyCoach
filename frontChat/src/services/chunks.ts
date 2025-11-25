import { ApiClient } from '../utils/axios';

// 知识块状态枚举
export enum ChunkStatus {
  ACTIVE = 0,    // 启用
  DISABLED = 1   // 禁用
}

// 知识块数据类型
export interface KnowledgeChunk {
  id: number;
  knowledgeDocId: number;
  chunkId: string;
  content: string;
  ext: string;
  status: ChunkStatus;
  createdAt: string;
  updatedAt: string;
}

// API 请求/响应类型
export interface ChunksListReq {
  knowledge_doc_id: number;
  page?: number;
  size?: number;
}

export interface ChunksListRes {
  data: KnowledgeChunk[];
  total: number;
  page: number;
  size: number;
}

export interface ChunkDeleteReq {
  id: number;
}

export interface UpdateChunkReq {
  ids: number[];
  status: ChunkStatus;
}

export interface UpdateChunkContentReq {
  id: number;
  content: string;
}

/**
 * 知识块 API 服务
 */
export class ChunksService {
  private static readonly BASE_PATH = '/gateway/v1';

  /**
   * 获取知识块列表
   */
  static async getList(params: ChunksListReq): Promise<ChunksListRes> {
    const queryParams = {
      knowledge_doc_id: params.knowledge_doc_id,
      page: params.page || 1,
      size: params.size || 10
    };
    return ApiClient.get<ChunksListRes>(`${this.BASE_PATH}/chunksList`, queryParams);
  }

  /**
   * 删除知识块
   */
  static async delete(params: ChunkDeleteReq): Promise<void> {
    return ApiClient.delete<void>(`${this.BASE_PATH}/chunksDelete?id=${params.id}`);
  }

  /**
   * 批量更新知识块状态
   */
  static async updateStatus(data: UpdateChunkReq): Promise<void> {
    return ApiClient.put<void>(`${this.BASE_PATH}/chunksPut`, data);
  }

  /**
   * 更新知识块内容
   */
  static async updateContent(data: UpdateChunkContentReq): Promise<void> {
    return ApiClient.put<void>(`${this.BASE_PATH}/chunks_content`, data);
  }
}

export default ChunksService;