/**
 * @fileoverview 路由配置文件
 * @description 定义应用程序的所有路由常量、配置和相关工具函数
 * @author 开发团队
 * @version 1.0.0
 */

/**
 * 路由路径常量
 * @description 定义应用中所有页面的路由路径，使用常量避免硬编码
 */
export const ROUTES = {
  AICHAT: '/',
  KNOWLEDGEBASE: '/knowledgebase',
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  NOT_FOUND: '/404',
} as const;

/**
 * 路由配置接口
 * @description 定义单个路由的配置结构
 */
export interface RouteConfig {
  /** 路由路径 */
  path: string;
  /** 路由名称，用于标识 */
  name: string;
  /** 对应的组件名称 */
  component: string;
  /** 是否需要身份验证 */
  requireAuth?: boolean;
  /** 路由元信息 */
  meta?: {
    /** 页面标题 */
    title?: string;
    /** 页面描述 */
    description?: string;
    /** SEO关键词 */
    keywords?: string[];
  };
}

/**
 * 路由配置数组
 * @description 包含应用中所有页面的详细配置信息
 */
export const routeConfigs: RouteConfig[] = [
  {
    path: ROUTES.AICHAT,
    name: 'aichat',
    component: 'AiChat',
    meta: {
      title: 'AI聊天 - 通用模板',
      description: '与AI助手进行智能对话',
      keywords: ['AI聊天', '人工智能', '智能对话'],
    },
  },
  {
    path: ROUTES.KNOWLEDGEBASE,
    name: 'knowledgebase',
    component: 'KnowledgeBase',
    meta: {
      title: '知识库 - 通用模板',
      description: 'RAG知识库管理和文档检索',
      keywords: ['知识库', 'RAG', '文档检索', 'AI'],
    },
  },
  {
    path: ROUTES.ABOUT,
    name: 'about',
    component: 'About',
    meta: {
      title: '关于我们 - 通用模板',
      description: '了解我们的团队和企业文化',
      keywords: ['关于', '团队', '企业'],
    },
  },
  {
    path: ROUTES.LOGIN,
    name: 'login',
    component: 'Login',
    meta: {
      title: '用户登录 - 通用模板',
      description: '登录您的账户',
      keywords: ['登录', '用户认证', '账户'],
    },
  },
  {
    path: ROUTES.REGISTER,
    name: 'register',
    component: 'Register',
    meta: {
      title: '用户注册 - 通用模板',
      description: '创建新的用户账户',
      keywords: ['注册', '新用户', '账户创建'],
    },
  },
  {
    path: ROUTES.RESET_PASSWORD,
    name: 'resetPassword',
    component: 'ResetPassword',
    meta: {
      title: '重置密码 - 通用模板',
      description: '重置您的账户密码',
      keywords: ['重置密码', '忘记密码', '密码找回'],
    },
  },
  {
    path: ROUTES.NOT_FOUND,
    name: 'notFound',
    component: 'NotFound',
    meta: {
      title: '页面未找到 - 通用模板',
      description: '您访问的页面不存在',
      keywords: ['404', '页面未找到'],
    },
  },
];

/**
 * 根据路径获取路由配置
 * @description 通过路由路径查找对应的路由配置信息
 * @param {string} path - 路由路径
 * @returns {RouteConfig | undefined} 匹配的路由配置，如果未找到则返回undefined
 * @example
 * ```ts
 * const config = getRouteConfig('/aichat');
 * console.log(config?.meta?.title); // 'AI聊天 - 通用模板'
 * ```
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return routeConfigs.find(config => config.path === path);
};

/**
 * 根据名称获取路由路径
 * @description 通过路由名称查找对应的路由路径
 * @param {string} name - 路由名称
 * @returns {string | undefined} 匹配的路由路径，如果未找到则返回undefined
 * @example
 * ```ts
 * const path = getRoutePath('aichat');
 * console.log(path); // '/aichat'
 * ```
 */
export const getRoutePath = (name: string): string | undefined => {
  const config = routeConfigs.find(config => config.name === name);
  return config?.path;
};