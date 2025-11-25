import { StrictMode } from 'react'
/**
 * @fileoverview 应用程序入口文件
 * @description React应用的主入口点，负责渲染根组件并配置路由和国际化
 * @author 开发团队
 * @version 1.0.0
 */

import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router';


/**
 * 应用程序启动
 * @description 创建React根节点并渲染应用
 * - 使用StrictMode进行开发时的额外检查
 * - 配置Ant Design的中文语言包
 * - 设置React Router路由系统
 */
createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN}>
    <RouterProvider router={router} />
  </ConfigProvider>,
)
