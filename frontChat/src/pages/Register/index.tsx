/**
 * @fileoverview 用户注册页面
 * @description 用户注册界面，包含完整的表单验证、密码强度检查等功能
 * @author 开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Divider, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import { LoginRegisterService } from '../../services/login_register';
import './index.scss';

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
  const { t } = useTranslation();
  /** 表单实例 */
  const [form] = Form.useForm();
  /** 注册加载状态 */
  const [loading, setLoading] = useState(false);
  /** 是否可以返回上一页 */
  const [canGoBack, setCanGoBack] = useState(false);
  /** 路由导航钩子 */
  const navigate = useNavigate();
  /** 当前路由位置信息 */
  const location = useLocation();

  /**
   * 判断是否可以返回上一页
   * @description 通过多种方式检测是否有可返回的上一页
   */
  useEffect(() => {
    // 方法1: 检查路由状态中是否有来源页面信息
    const hasFromState = location.state?.from;
    
    // 方法2: 检查 document.referrer 是否存在且不为空
    const hasReferrer = document.referrer && 
                       document.referrer !== window.location.href &&
                       !document.referrer.includes('/register');
    
    // 方法3: 检查 sessionStorage 中的导航历史
    const navigationHistory = sessionStorage.getItem('navigationHistory');
    const hasNavigationHistory = navigationHistory && 
                                JSON.parse(navigationHistory).length > 1;
    
    // 如果任一条件满足，则认为可以返回上一页
    const canReturn = hasFromState || hasReferrer || hasNavigationHistory;
    setCanGoBack(canReturn);
    
    // 记录当前页面到导航历史
    const currentHistory = navigationHistory ? JSON.parse(navigationHistory) : [];
    currentHistory.push('/register');
    // 限制历史记录长度，避免内存占用过多
    if (currentHistory.length > 10) {
      currentHistory.shift();
    }
    sessionStorage.setItem('navigationHistory', JSON.stringify(currentHistory));
  }, [location]);

  /**
   * 处理注册表单提交
   * @description 验证用户输入并执行注册逻辑
   * @param {RegisterFormData} values - 表单数据
   */
  const handleSubmit = async (values: RegisterFormData): Promise<void> => {
    setLoading(true);
    try {
      // 调用后端注册API
      const result = await LoginRegisterService.register({
        username: values.username,
        email: values.email,
        password: values.password
      });

      if (result && result.id) {
        message.success(t('auth.success.register'));
        // 注册成功跳转到登录页
        navigate('/login');
      } else {
        message.error(t('auth.error.register'));
      }
    } catch (error) {
      console.error('注册请求失败:', error);
      // 拦截器已处理错误提示
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理返回按钮点击
   * @description 根据是否有上一页来决定返回行为
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

  /**
   * 密码强度验证
   * @description 验证密码是否符合安全要求（至少6位，包含大小写字母和数字）
   * @param {any} _ - 规则对象（未使用）
   * @param {string} value - 密码值
   * @returns {Promise<void>} 验证结果
   */
  const validatePassword = (_: any, value: string): Promise<void> => {
    if (!value) {
      return Promise.reject(new Error(t('auth.validation.passwordRequired')));
    }
    if (value.length < 6) {
      return Promise.reject(new Error(t('auth.validation.passwordMin')));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(new Error(t('auth.validation.passwordPattern')));
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
      return Promise.reject(new Error(t('auth.validation.confirmPasswordRequired')));
    }
    if (value !== form.getFieldValue('password')) {
      return Promise.reject(new Error(t('auth.validation.passwordMismatch')));
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
      return Promise.reject(new Error(t('auth.validation.emailRequired')));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error(t('auth.validation.emailInvalid')));
    }
    return Promise.resolve();
  };



  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      loading={loading}
    >
      {/* 返回按钮 */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={handleGoBack}
        className="back-button"
        style={{ marginBottom: '16px' }}
      >
        {canGoBack ? t('common.back') : t('common.home')}
      </Button>
      
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
            { required: true, message: t('auth.validation.usernameRequired') },
            { min: 3, message: t('auth.validation.usernameMin') },
            { max: 20, message: t('auth.validation.usernameMax') },
            { pattern: /^[a-zA-Z0-9_]+$/, message: t('auth.validation.usernamePattern') }
          ]}
        >
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder={t('auth.username')}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[{ validator: validateEmail }]}
        >
          <Input
            prefix={<MailOutlined className="site-form-item-icon" />}
            placeholder={t('auth.email')}
            allowClear
          />
        </Form.Item>



        <Form.Item
          name="password"
          rules={[{ validator: validatePassword }]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder={t('auth.password')}
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
            placeholder={t('auth.confirmPassword')}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error(t('auth.validation.agreementRequired'))),
            },
          ]}
        >
          <Checkbox>
            {t('auth.agreement')}
            <Link to="/terms" target="_blank" className="agreement-link">
              {t('auth.terms')}
            </Link>
            {t('auth.and')}
            <Link to="/privacy" target="_blank" className="agreement-link">
              {t('auth.privacy')}
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
            {loading ? t('auth.registerLoading') : t('auth.registerBtn')}
          </Button>
        </Form.Item>

        <Divider plain>{t('auth.haveAccount')}</Divider>
        
        <Form.Item>
          <div className="login-link">
            <span>{t('auth.haveAccount')}</span>
            <Link to="/login" className="login-btn">
              {t('auth.loginNow')}
            </Link>
          </div>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};

export default Register;