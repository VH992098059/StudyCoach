import axios, { type AxiosInstance} from 'axios';
import { API_CONFIG } from './config';
import { requestInterceptor, responseInterceptor } from './interceptors';
import type { RequestConfig } from './types';
// 注意：某些情况下浏览器开发工具会代理 XMLHttpRequest 并对 blob/arraybuffer 的 responseText 访问抛错。
// 为此我们提供一个基于 fetch 的二进制请求辅助方法，以避免 XHR 代理造成的干扰。

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
   * POST 请求，返回 Blob（二进制），内部使用 fetch 以避免 XHR 的 responseText 读取错误
   */
  static async postBlob(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<Blob> {
    const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${base}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers || {}),
    };
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const showLoading = config?.showLoading !== false;
    if (showLoading) {
      console.log('Request started (blob):', fullUrl);
    }
    const resp = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      // 允许通过 RequestConfig.signal 取消请求
      signal: config?.signal,
    });
    if (showLoading) {
      console.log('Request completed (blob):', fullUrl);
    }
    if (!resp.ok) {
      const msg = `请求失败 (${resp.status})`;
      throw new Error(msg);
    }
    return await resp.blob();
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