/**
 * @fileoverview 文档管理 API 服务
 * @description 提供文档列表、删除等API接口
 * @author 开发团队
 * @version 1.0.0
 */

import ApiClient from '../utils/axios/index';

/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  PENDING = 0,    // 待处理
  INDEXING = 1,   // 索引中
  ACTIVE = 2,     // 已完成
  FAILED = 3      // 失败
}

/**
 * 文档数据接口 - 对应后端 entity.KnowledgeDocuments
 */
export interface DocumentData {
  id: number;
  knowledgeBaseName: string;
  fileName: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * 文档列表请求参数
 */
export interface DocumentsListReq {
  knowledge_name: string;
  page?: number;
  size?: number;
}

/**
 * 文档列表响应数据
 */
export interface DocumentsListRes {
  data: DocumentData[];
  total: number;
  page: number;
  size: number;
}

/**
 * 文档删除请求参数
 */
export interface DocumentDeleteReq {
  document_id: number;
}

const BASE_PATH = '/gateway/v1';

/**
 * 文档 API 服务
 */
export const DocumentsService = { 
  /**
   * 获取文档列表
   */
  getList: async (params: DocumentsListReq): Promise<DocumentsListRes> => {
    const queryParams = {
      knowledge_name: params.knowledge_name,
      page: params.page || 1,
      size: params.size || 10
    };
    return ApiClient.get<DocumentsListRes>(`${BASE_PATH}/documents`, queryParams);
  },

  /**
   * 删除文档
   */
  delete: async (params: DocumentDeleteReq): Promise<void> => {
    return ApiClient.delete<void>(`${BASE_PATH}/documentsDelete?document_id=${params.document_id}`);
  },

  /**
   * 获取状态文本
   */
  getStatusText: (status: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.PENDING:
        return '待处理';
      case DocumentStatus.INDEXING:
        return '索引中';
      case DocumentStatus.ACTIVE:
        return '已完成';
      case DocumentStatus.FAILED:
        return '失败';
      default:
        return '未知';
    }
  },

  /**
   * 获取状态标签类型
   */
  getStatusType: (status: DocumentStatus): 'processing' | 'success' | 'error' | 'default' => {
    switch (status) {
      case DocumentStatus.PENDING:
        return 'default';
      case DocumentStatus.INDEXING:
        return 'processing';
      case DocumentStatus.ACTIVE:
        return 'success';
      case DocumentStatus.FAILED:
        return 'error';
      default:
        return 'default';
    }
  }
};

export default DocumentsService;
