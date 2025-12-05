/**
 * @fileoverview 文档检索服务
 * @description 提供文档检索相关的API接口
 * @author 开发团队
 * @version 1.0.0
 */

import { ApiClient } from '../utils/axios';

/**
 * 检索请求参数接口
 */
export interface RetrieverReq {
  question: string;
  top_k?: number;
  score?: number;
  knowledge_name: string;
}

/**
 * 文档元数据接口
 */
export interface DocumentMetadata {
  _score: number;
  ext: {
    _file_name: string;
  };
}

/**
 * 检索结果文档接口
 */
export interface RetrievalDocument {
  id?: string;
  content: string;
  score?: number;
  meta_data: DocumentMetadata;
}

/**
 * 检索响应接口
 */
export interface RetrieverRes {
  document: RetrievalDocument[];
}

/**
 * 文档检索服务
 */
export const RetrieverService = {
  /**
   * 检索文档
   * @param params 检索参数
   * @returns 检索结果
   */
  retrieve: async (params: RetrieverReq): Promise<RetrieverRes> => {
    const requestData = {
      question: params.question,
      top_k: params.top_k || 5,
      score: params.score || 0.2,
      knowledge_name: params.knowledge_name
    };

    return ApiClient.post('/gateway/v1/retriever', requestData);
  }
};

export default RetrieverService;
