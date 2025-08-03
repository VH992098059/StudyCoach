import React, { useState } from 'react';
import { Form, Input, Button, message, Steps, Result } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import './ResetPassword.css';

const { Step } = Steps;

interface ResetPasswordFormData {
  email?: string;
  verificationCode?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const ResetPassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // 发送验证码
  const handleSendCode = async (values: { email: string }) => {
    setLoading(true);
    try {
      // 模拟发送验证码API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('发送验证码到:', values.email);
      setEmail(values.email);
      message.success('验证码已发送到您的邮箱！');
      
      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setCurrentStep(1);
    } catch (error) {
      console.error('发送验证码失败:', error);
      message.error('发送验证码失败，请稍后重试！');
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async (values: { verificationCode: string }) => {
    setLoading(true);
    try {
      // 模拟验证码验证API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('验证码:', values.verificationCode);
      
      // 模拟验证成功
      if (values.verificationCode === '123456') {
        message.success('验证码验证成功！');
        setCurrentStep(2);
      } else {
        message.error('验证码错误，请重新输入！');
      }
    } catch (error) {
      console.error('验证码验证失败:', error);
      message.error('验证失败，请稍后重试！');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (values: { newPassword: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      // 模拟重置密码API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('重置密码');
      message.success('密码重置成功！');
      setCurrentStep(3);
    } catch (error) {
      console.error('密码重置失败:', error);
      message.error('密码重置失败，请稍后重试！');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入新密码！'));
    }
    if (value.length < 6) {
      return Promise.reject(new Error('密码至少6个字符！'));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(new Error('密码必须包含大小写字母和数字！'));
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请确认新密码！'));
    }
    if (value !== form.getFieldValue('newPassword')) {
      return Promise.reject(new Error('两次输入的密码不一致！'));
    }
    return Promise.resolve();
  };

  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入邮箱地址！'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入有效的邮箱地址！'));
    }
    return Promise.resolve();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Form
            form={form}
            name="sendCode"
            onFinish={handleSendCode}
            autoComplete="off"
            size="large"
            className="reset-password-form"
          >
            <Form.Item
              name="email"
              rules={[{ validator: validateEmail }]}
            >
              <Input
                prefix={<MailOutlined className="site-form-item-icon" />}
                placeholder="请输入您的邮箱地址"
                allowClear
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="reset-password-btn"
                block
              >
                {loading ? '发送中...' : '发送验证码'}
              </Button>
            </Form.Item>
          </Form>
        );
      
      case 1:
        return (
          <Form
            form={form}
            name="verifyCode"
            onFinish={handleVerifyCode}
            autoComplete="off"
            size="large"
            className="reset-password-form"
          >
            <div className="email-info">
              验证码已发送到：<strong>{email}</strong>
            </div>
            <Form.Item
              name="verificationCode"
              rules={[
                { required: true, message: '请输入验证码！' },
                { len: 6, message: '验证码为6位数字！' }
              ]}
            >
              <Input
                prefix={<SafetyOutlined className="site-form-item-icon" />}
                placeholder="请输入6位验证码"
                maxLength={6}
                allowClear
              />
            </Form.Item>
            <Form.Item>
              <div className="resend-code">
                {countdown > 0 ? (
                  <span className="countdown-text">{countdown}秒后可重新发送</span>
                ) : (
                  <Button
                    type="link"
                    onClick={() => {
                      setCurrentStep(0);
                      form.resetFields();
                    }}
                    className="resend-btn"
                  >
                    重新发送验证码
                  </Button>
                )}
              </div>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="reset-password-btn"
                block
              >
                {loading ? '验证中...' : '验证验证码'}
              </Button>
            </Form.Item>
          </Form>
        );
      
      case 2:
        return (
          <Form
            form={form}
            name="resetPassword"
            onFinish={handleResetPassword}
            autoComplete="off"
            size="large"
            className="reset-password-form"
          >
            <Form.Item
              name="newPassword"
              rules={[{ validator: validatePassword }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="请输入新密码"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[{ validator: validateConfirmPassword }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="请确认新密码"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="reset-password-btn"
                block
              >
                {loading ? '重置中...' : '重置密码'}
              </Button>
            </Form.Item>
          </Form>
        );
      
      case 3:
        return (
          <Result
            status="success"
            title="密码重置成功！"
            subTitle="您的密码已成功重置，请使用新密码登录。"
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={() => navigate('/login')}
                className="reset-password-btn"
              >
                立即登录
              </Button>,
              <Button
                key="home"
                onClick={() => navigate('/')}
              >
                返回AI聊天
              </Button>,
            ]}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthLayout
      title="重置密码"
      subtitle="请按照步骤重置您的密码"
      loading={loading && currentStep !== 3}
    >
      <div className="reset-password-container">
        {currentStep < 3 && (
          <Steps current={currentStep} className="reset-password-steps">
            <Step title="验证邮箱" description="输入邮箱地址" />
            <Step title="验证身份" description="输入验证码" />
            <Step title="重置密码" description="设置新密码" />
          </Steps>
        )}
        
        <div className="step-content">
          {renderStepContent()}
        </div>
        
        {currentStep < 3 && (
          <div className="back-to-login">
            <Link to="/login" className="back-link">
              ← 返回登录
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;