import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import type { ApiResponse, ApiError } from './types';
import i18n from '../../i18n';
import { showTokenExpiredNotification } from './tokenExpiredNotification';
import { isTokenExpired } from '../token/tokenValidator';

/** 清除所有认证相关存储（token、userInfo、localStorage、sessionStorage） */
export const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('userInfo');
  sessionStorage.removeItem('userInfo');
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

/**
 * 请求拦截器
 */
export const requestInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    // 主动检查 token 是否过期（在发送请求前）
    const token = localStorage.getItem('access_token');
    if (token && isTokenExpired(token)) {
      // token 已过期，清除认证信息并拒绝请求
      clearAuthStorage();
      showTokenExpiredNotification();
      // 返回拒绝的 Promise，阻止请求发送
      return Promise.reject(
        new Error('Token expired - authentication cleared')
      ) as any;
    }

    // 添加认证 token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 处理 FormData 请求，删除 Content-Type 让浏览器自动设置
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
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
  onFulfilled: (response: AxiosResponse<any>) => {
    const { data, config } = response;
    const responseType = (config as any).responseType;
    // 对于二进制/流式响应，直接返回原始数据
    if (responseType === 'blob' || responseType === 'arraybuffer') {
      // 隐藏 loading
      const showLoading = (config as any).showLoading !== false;
      if (showLoading) {
        console.log('Request completed (binary):', config.url);
      }
      return data;
    }
    
    // 隐藏 loading
    const showLoading = (config as any).showLoading !== false;
    if (showLoading) {
      console.log('Request completed:', config.url);
    }

    // 检查业务状态码 (GoFrame使用code=0表示成功)
    if (data && typeof data === 'object' && 'code' in data && (data as any).code === 0) {
      return (data as any).data;
    } else {
      const bizCode = (data as any)?.code ?? -1;
      const error: ApiError = {
        code: bizCode,
        message: (data as any)?.message ?? i18n.t('api.requestFailed'),
        details: (data as any)?.data,
      };

      // 业务层返回 401 未授权或 token 无效时，清除认证并退出登录
      const msg = String((data as any)?.message || '').toLowerCase();
      const isTokenInvalid =
        bizCode === 401 ||
        bizCode === 4010 ||
        msg.includes('token is invalid') ||
        msg.includes('token') && (msg.includes('invalid') || msg.includes('失效') || msg.includes('过期') || msg.includes('empty')) ||
        msg.includes('验证') && (msg.includes('过期') || msg.includes('不存在') || msg.includes('非法'));
      if (isTokenInvalid) {
        const isLoginRequest = String(config?.url || '').includes('/login') && (config?.method?.toLowerCase() === 'post');
        if (!isLoginRequest) {
          clearAuthStorage();
        }
        if ((config as any).showError !== false) {
          showTokenExpiredNotification();
        }
      } else {
        const showError = (config as any).showError !== false;
        if (showError) {
          message.error(error.message);
        }
      }

      return Promise.reject(error);
    }
  },
  onRejected: (error: AxiosError) => {
    const { response, config } = error;
    const showError = (config as any)?.showError !== false;

    if (response) {
      const { status, data } = response;
      let errorMessage = i18n.t('api.requestFailed');

      switch (status) {
        case 401:
          errorMessage = (data as any)?.message || i18n.t('api.loginExpired');
          clearAuthStorage();
          if (showError) {
            showTokenExpiredNotification();
          }
          break;
        case 403:
          errorMessage = (data as any)?.message || i18n.t('api.forbidden');
          break;
        case 404:
          errorMessage = (data as any)?.message || i18n.t('api.notFound');
          break;
        case 500:
          errorMessage = (data as any)?.message || i18n.t('api.internalServerError');
          break;
        default:
          errorMessage = (data as any)?.message || i18n.t('api.requestFailedWithStatus', { status });
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
      const errorMessage = i18n.t('api.networkError');
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
