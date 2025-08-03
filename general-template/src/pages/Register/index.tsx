/**
 * @fileoverview 用户注册页面
 * @description 用户注册界面，包含完整的表单验证、密码强度检查等功能
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Form, Input, Button, message, Divider, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import './index.css';

/**
 * 注册表单数据接口
 * @interface RegisterFormData
 */
interface RegisterFormData {
  /** 用户名 */
  username: string;
  /** 邮箱地址 */
  email: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 是否同意服务条款 */
  agreement: boolean;
}

/**
 * 用户注册组件
 * @description 提供用户注册功能，包含完整的表单验证、密码强度检查等特性
 * @example
 * ```tsx
 * <Register />
 * ```
 */
const Register: React.FC = ()=> {
  /** 表单实例 */
  const [form] = Form.useForm();
  /** 注册加载状态 */
  const [loading, setLoading] = useState(false);
  /** 路由导航钩子 */
  const navigate = useNavigate();

  /**
   * 处理注册表单提交
   * @description 验证用户输入并执行注册逻辑
   * @param {RegisterFormData} values - 表单数据
   */
  const handleSubmit = async (values: RegisterFormData): Promise<void> => {
    setLoading(true);
    try {
      // 调用后端注册API
      const response = await fetch('http://localhost:8000/gateway/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          email: values.email,
        }),
      });

      const data = await response.json();
      
      if (data.code===0) {
        // 注册成功
        message.success('注册成功！请登录您的账号。');
        console.log('注册成功:', data);
        
        // 跳转到登录页面
        navigate('/login');
      } else {
        // 注册失败，显示后端返回的错误信息
        const errorMessage = data.message || '注册失败，请稍后重试！';
        message.error(errorMessage);
        console.error('注册失败:', data);
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      message.error('网络错误，请检查网络连接后重试！');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 密码强度验证
   * @description 验证密码是否符合安全要求（至少6位，包含大小写字母和数字）
   * @param {any} _ - 规则对象（未使用）
   * @param {string} value - 密码值
   * @returns {Promise<void>} 验证结果
   */
  const validatePassword = (_: any, value: string): Promise<void> => {
    if (!value) {
      return Promise.reject(new Error('请输入密码！'));
    }
    if (value.length < 6) {
      return Promise.reject(new Error('密码至少6个字符！'));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(new Error('密码必须包含大小写字母和数字！'));
    }
    return Promise.resolve();
  };

  /**
   * 确认密码验证
   * @description 验证两次输入的密码是否一致
   * @param {any} _ - 规则对象（未使用）
   * @param {string} value - 确认密码值
   * @returns {Promise<void>} 验证结果
   */
  const validateConfirmPassword = (_: any, value: string): Promise<void> => {
    if (!value) {
      return Promise.reject(new Error('请确认密码！'));
    }
    if (value !== form.getFieldValue('password')) {
      return Promise.reject(new Error('两次输入的密码不一致！'));
    }
    return Promise.resolve();
  };

  /**
   * 邮箱格式验证
   * @description 验证邮箱地址格式是否正确
   * @param {any} _ - 规则对象（未使用）
   * @param {string} value - 邮箱值
   * @returns {Promise<void>} 验证结果
   */
  const validateEmail = (_: any, value: string): Promise<void> => {
    if (!value) {
      return Promise.reject(new Error('请输入邮箱地址！'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入有效的邮箱地址！'));
    }
    return Promise.resolve();
  };



  return (
    <AuthLayout
      title="用户注册"
      subtitle="创建您的账号，开始使用我们的服务"
      loading={loading}
    >
      <Form
        form={form}
        name="register"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
        className="register-form"
        scrollToFirstError
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名！' },
            { min: 3, message: '用户名至少3个字符！' },
            { max: 20, message: '用户名最多20个字符！' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线！' }
          ]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="用户名"
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[{ validator: validateEmail }]}
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder="邮箱地址"
            allowClear
          />
        </Form.Item>



        <Form.Item
          name="password"
          rules={[{ validator: validatePassword }]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[{ validator: validateConfirmPassword }]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="确认密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意服务条款！')),
            },
          ]}
        >
          <Checkbox>
            我已阅读并同意
            <Link to="/terms" target="_blank" className="agreement-link">
              《服务条款》
            </Link>
            和
            <Link to="/privacy" target="_blank" className="agreement-link">
              《隐私政策》
            </Link>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="register-submit-btn"
            block
          >
            {loading ? '注册中...' : '立即注册'}
          </Button>
        </Form.Item>

        <Divider plain>已有账号？</Divider>
        
        <Form.Item>
          <div className="login-link">
            <span>已有账号？</span>
            <Link to="/login" className="login-btn">
              立即登录
            </Link>
          </div>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};

export default Register;