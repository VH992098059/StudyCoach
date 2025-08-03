import axios, { type AxiosInstance} from 'axios';
import { API_CONFIG } from './config';
import { requestInterceptor, responseInterceptor } from './interceptors';
import type { RequestConfig } from './types';

/**
 * 创建 axios 实例
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 添加请求拦截器
  instance.interceptors.request.use(
    requestInterceptor.onFulfilled,
    requestInterceptor.onRejected
  );

  // 添加响应拦截器
  instance.interceptors.response.use(
    responseInterceptor.onFulfilled,
    responseInterceptor.onRejected
  );

  return instance;
};

/**
 * 主要的 axios 实例
 */
const http = createAxiosInstance();

/**
 * 请求方法封装
 */
export class ApiClient {
  /**
   * GET 请求
   */
  static get<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<T> {
    return http.get(url, {
      params,
      ...config,
    });
  }

  /**
   * POST 请求
   */
  static post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return http.post(url, data, config);
  }

  /**
   * PUT 请求
   */
  static put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return http.put(url, data, config);
  }

  /**
   * DELETE 请求
   */
  static delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<T> {
    return http.delete(url, config);
  }

  /**
   * PATCH 请求
   */
  static patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return http.patch(url, data, config);
  }

  /**
   * 文件上传
   */
  static upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return http.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
      ...config,
    });
  }

  /**
   * 文件下载
   */
  static download(
    url: string,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    return http.get(url, {
      responseType: 'blob',
      ...config,
    }).then((data: any) => {
      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    });
  }
}

/**
 * 导出默认实例和方法
 */
export default ApiClient;
export { http };