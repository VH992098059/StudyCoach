/**
 * @fileoverview 用户登录页面
 * @description 用户登录界面，包含表单验证、记住密码等功能
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import './index.scss';

/**
 * 登录表单数据接口
 * @interface LoginFormData
 */
interface LoginFormData {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 是否记住登录状态 */
  remember: boolean;
}

/**
 * 用户登录组件
 * @description 提供用户登录功能，包含表单验证、记住密码等特性
 * @example
 * ```tsx
 * <Login />
 * ```
 */
const Login: React.FC = ()=> {
  /** 表单实例 */
  const [form] = Form.useForm();
  /** 登录加载状态 */
  const [loading, setLoading] = useState(false);
  /** 是否有上一页可以返回 */
  const [canGoBack, setCanGoBack] = useState(false);
  /** 路由导航钩子 */
  const navigate = useNavigate();
  /** 当前路由位置 */
  const location = useLocation();

  /**
   * 检查是否有上一页可以返回
   * @description 通过检查location.state或document.referrer来判断
   */
  useEffect(() => {
    // 方法1: 检查是否通过路由导航进入（有state信息）
    const hasNavigationState = location.state && location.state.from;
    
    // 方法2: 检查document.referrer（上一页的URL）
    const hasReferrer = document.referrer && 
                       document.referrer !== window.location.href &&
                       !document.referrer.includes('/login'); // 避免从登录页跳转到登录页的情况
    
    // 方法3: 检查sessionStorage中是否有导航历史
    const navigationHistory = sessionStorage.getItem('navigationHistory');
    const hasHistory = navigationHistory && JSON.parse(navigationHistory).length > 1;
    
    setCanGoBack(hasNavigationState || hasReferrer || hasHistory);
  }, [location]);

  /**
   * 处理登录表单提交
   * @description 验证用户凭据并执行登录逻辑
   * @param {LoginFormData} values - 表单数据
   */
  const handleSubmit = async (values: LoginFormData): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/gateway/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username, // 后端需要 username 字段
          password: values.password,
        }),
      });

      const result = await response.json();
      console.log(result);
      
      if (response.ok && result.code === 0 && result.data.token) {
        message.success('登录成功！');

        const userInfo = {
          username: values.username,
          token: result.data.token,
          uuid: result.data.uuid,
          loginTime: new Date().toISOString(),
        };

        if (values.remember) {
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        } else {
          sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
        
        // 跳转到首页
        navigate('/');
      } else {
        message.error(result.message || '登录失败，请检查您的凭据。');
      }
    } catch (error) {
      console.error('登录请求失败:', error);
      message.error('登录请求失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理忘记密码点击事件
   * @description 跳转到密码重置页面
   */
  const handleForgotPassword = (): void => {
    navigate('/reset-password');
  };

  /**
   * 处理返回按钮点击事件
   * @description 返回上一个页面，如果没有上一页则返回主页
   */
  const handleGoBack = (): void => {
    if (canGoBack) {
      // 有上一页，返回上一页
      navigate(-1);
    } else {
      // 没有上一页，返回主页
      navigate('/');
    }
  };

  return (
    <AuthLayout
      title="用户登录"
      subtitle="欢迎回来，请输入您的账号信息"
      loading={loading}
    >
      {/* 返回按钮 */}
      <div className="auth-back-button">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
          className="back-btn"
        >
          返回
        </Button>
      </div>
      
      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
        className="login-form"
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名！' },
            { min: 3, message: '用户名至少3个字符！' },
            { max: 20, message: '用户名最多20个字符！' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="用户名"
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码！' },
            { min: 6, message: '密码至少6个字符！' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item>
          <div className="login-options">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Button
              type="link"
              onClick={handleForgotPassword}
              className="forgot-password-link"
            >
              忘记密码？
            </Button>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="login-submit-btn"
            block
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </Form.Item>

        <Divider plain>还没有账号？</Divider>
        
        <Form.Item>
          <div className="register-link">
            <span>还没有账号？</span>
            <Link to="/register" className="register-btn">
              立即注册
            </Link>
          </div>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};

export default Login;