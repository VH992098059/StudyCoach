/**
 * @fileoverview 头部导航组件
 * @description 应用的顶部导航栏，包含Logo、导航菜单、用户操作区域和移动端适配
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Drawer } from 'antd';
import { UserOutlined, LoginOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import './index.scss';

const { Header: AntHeader } = Layout;

/**
 * 头部导航组件属性接口
 * @interface HeaderProps
 */
interface HeaderProps {
  /** Logo图片URL */
  logo?: string;
  /** 网站标题 */
  title?: string;
  /** 导航菜单项配置 */
  menuItems?: MenuProps['items'];
  /** 当前登录用户信息 */
  user?: {
    /** 用户名 */
    name: string;
    /** 用户头像URL */
    avatar?: string;
  };
  /** 登录按钮点击回调 */
  onLogin?: () => void;
  /** 登出按钮点击回调 */
  onLogout?: () => void;
  /** 菜单项点击回调 */
  onMenuClick?: (key: string) => void;
}

/**
 * 头部导航组件
 * @description 应用顶部导航栏，支持响应式设计，包含Logo、导航菜单、用户操作等功能
 * @param {HeaderProps} props - 组件属性
 * @example
 * ```tsx
 * <Header
 *   title="我的应用"
 *   logo="/logo.png"
 *   menuItems={[
 *     { key: 'home', label: '首页' },
 *     { key: 'about', label: '关于' }
 *   ]}
 *   user={{ name: '张三', avatar: '/avatar.jpg' }}
 *   onLogout={handleLogout}
 * />
 * ```
 */
const Header: React.FC<HeaderProps> = ({
  logo,
  title = '通用模板',
  menuItems = [],
  user,
  onLogin,
  onLogout,
  onMenuClick,
})=> {
  /**
   * 移动端菜单显示状态
   * @description 控制移动端抽屉菜单的显示和隐藏
   */
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  
  /**
   * 用户下拉菜单配置
   * @description 登录用户的操作菜单项
   */
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  /**
   * 根据当前路径获取选中的菜单项
   * @description 根据当前页面路径确定导航菜单中应该高亮的项目
   * @returns {string[]} 选中的菜单项key数组
   */
  const getSelectedKeys = (): string[] => {
    const pathname = location.pathname;
    switch (pathname) {
      case '/':
        return ['aichat'];
      case '/knowledgebase':
        return ['knowledgebase'];
      case '/indexer':
        return ['indexer'];
      case '/documents':
        return ['documents'];
      case '/chunks':
        return ['chunks'];
      case '/retriever':
        return ['retriever'];
      case '/about':
        return ['about'];
      default:
        return [];
    }
  };

  /**
   * 处理菜单点击事件
   * @description 处理导航菜单的点击事件，执行路由跳转并调用回调函数
   * @param {Object} e - 菜单点击事件对象
   */
  const handleMenuClick: MenuProps['onClick'] = (e): void => {
    // 路由跳转
    switch (e.key) {
      case 'aichat':
        navigate('/');
        break;
      case 'knowledgebase':
        navigate('/knowledgebase');
        break;
      case 'indexer':
        navigate('/indexer');
        break;
      case 'documents':
        navigate('/documents');
        break;
      case 'chunks':
        navigate('/chunks');
        break;
      case 'retriever':
        navigate('/retriever');
        break;
      case 'about':
        navigate('/about');
        break;
      default:
        break;
    }
    
    // 调用原有的回调
    onMenuClick?.(e.key);
    
    // 关闭移动端菜单
    setMobileMenuVisible(false);
  };

  /**
   * 切换移动端菜单显示状态
   * @description 控制移动端抽屉菜单的显示和隐藏
   */
  const toggleMobileMenu = (): void => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  return (
    <AntHeader className="header">
      <div className="header-content">
        {/* Logo区域 */}
        <div className="header-logo">
          {logo && <img src={logo} alt="logo" className="logo-image" />}
          <span className="logo-title">{title}</span>
        </div>

        {/* 主导航菜单 */}
        <div className="header-nav">
          <Menu
            theme="dark"
            mode="horizontal"
            items={menuItems}
            onClick={handleMenuClick}
            selectedKeys={getSelectedKeys()}
            className="nav-menu"
          />
        </div>

        {/* 移动端菜单按钮 */}
        <Button
          className="mobile-menu-btn"
          icon={<MenuOutlined />}
          onClick={toggleMobileMenu}
        />

        {/* 用户操作区 */}
        <div className="header-user">
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space className="user-info">
                <Avatar
                  src={user.avatar}
                  icon={!user.avatar && <UserOutlined />}
                  size="small"
                />
                <span className="user-name">{user.name}</span>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Button
                type="default"
                size="small"
                onClick={() => navigate('/register')}
              >
                注册
              </Button>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                size="small"
              >
                登录
              </Button>
            </Space>
          )}
        </div>
      </div>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title={title}
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        className="mobile-drawer"
        width={280}
      >
        <Menu
          mode="vertical"
          items={menuItems}
          onClick={handleMenuClick}
          selectedKeys={getSelectedKeys()}
          className="mobile-nav-menu"
        />
        
        {/* 移动端用户操作区 */}
        <div className="mobile-user-actions">
          {user ? (
            <>
              <Button
                block
                icon={<UserOutlined />}
                onClick={() => {
                  setMobileMenuVisible(false);
                  // 这里可以添加跳转到个人信息页面的逻辑
                }}
              >
                个人信息
              </Button>
              <Button
                block
                icon={<LogoutOutlined />}
                onClick={() => {
                  setMobileMenuVisible(false);
                  onLogout?.();
                }}
              >
                退出登录
              </Button>
            </>
          ) : (
            <>
              <Button
                block
                onClick={() => {
                  setMobileMenuVisible(false);
                  navigate('/register');
                }}
              >
                注册
              </Button>
              <Button
                block
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => {
                  setMobileMenuVisible(false);
                  navigate('/login');
                }}
              >
                登录
              </Button>
            </>
          )}
        </div>
      </Drawer>
    </AntHeader>
  );
};

export default Header;