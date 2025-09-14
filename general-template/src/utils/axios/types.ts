/**
 * 通用 API 响应接口
 * 对应 GoFrame 的 DefaultHandlerResponse 结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

/**
 * 请求配置接口
 */
export interface RequestConfig {
  showLoading?: boolean;
  showError?: boolean;
  retry?: boolean;
  cache?: boolean;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 错误信息接口
 */
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}