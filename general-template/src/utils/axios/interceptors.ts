import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import type { ApiResponse, ApiError } from './types';

/**
 * 请求拦截器
 */
export const requestInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    // 添加认证 token
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求时间戳
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }

    // 显示 loading
    const showLoading = (config as any).showLoading !== false;
    if (showLoading) {
      // 这里可以集成 loading 组件
      console.log('Request started:', config.url);
    }

    return config;
  },
  onRejected: (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  },
};

/**
 * 响应拦截器
 */
export const responseInterceptor = {
  onFulfilled: (response: AxiosResponse<ApiResponse>) => {
    const { data, config } = response;
    
    // 隐藏 loading
    const showLoading = (config as any).showLoading !== false;
    if (showLoading) {
      console.log('Request completed:', config.url);
    }

    // 检查业务状态码
    if (data.success) {
      return data.data;
    } else {
      const error: ApiError = {
        code: data.code,
        message: data.message,
        details: data.data,
      };
      
      // 显示错误信息
      const showError = (config as any).showError !== false;
      if (showError) {
        message.error(error.message);
      }
      
      return Promise.reject(error);
    }
  },
  onRejected: (error: AxiosError) => {
    const { response, config } = error;
    const showError = (config as any)?.showError !== false;

    if (response) {
      const { status, data } = response;
      let errorMessage = '请求失败';

      switch (status) {
        case 401:
          errorMessage = '登录已过期，请重新登录';
          // 清除 token 并跳转到登录页
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = '没有权限访问该资源';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = (data as any)?.message || `请求失败 (${status})`;
      }

      if (showError) {
        message.error(errorMessage);
      }

      return Promise.reject({
        code: status,
        message: errorMessage,
        details: data,
      });
    } else {
      const errorMessage = '网络连接失败，请检查网络设置';
      if (showError) {
        message.error(errorMessage);
      }
      
      return Promise.reject({
        code: 0,
        message: errorMessage,
      });
    }
  },
};