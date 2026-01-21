import React, { useState } from 'react';
import { Form, Input, Button, message, Steps, Result } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/AuthLayout';
import './ResetPassword.scss';


interface ResetPasswordFormData {
  email?: string;
  verificationCode?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ResetPasswordFormData>();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // 发送验证码
  const handleSendCode = async (values: ResetPasswordFormData) => {
    if (!values.email) return;
    setLoading(true);
    try {
      // 模拟发送验证码API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('发送验证码到:', values.email);
      setEmail(values.email);
      message.success(t('auth.resetPassword.messages.codeSent'));
      
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
      message.error(t('auth.resetPassword.messages.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async (values: ResetPasswordFormData) => {
    if (!values.verificationCode) return;
    setLoading(true);
    try {
      // 模拟验证码验证API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('验证码:', values.verificationCode);
      
      // 模拟验证成功
      if (values.verificationCode === '123456') {
        message.success(t('auth.resetPassword.messages.verifySuccess'));
        setCurrentStep(2);
      } else {
        message.error(t('auth.resetPassword.messages.verifyFailed'));
      }
    } catch (error) {
      console.error('验证码验证失败:', error);
      message.error(t('auth.resetPassword.messages.verifyError'));
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (values: ResetPasswordFormData) => {
    if (!values.newPassword || !values.confirmPassword) return;
    setLoading(true);
    try {
      // 模拟重置密码API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('重置密码');
      message.success(t('auth.resetPassword.messages.resetSuccess'));
      setCurrentStep(3);
    } catch (error) {
      console.error('密码重置失败:', error);
      message.error(t('auth.resetPassword.messages.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.pwdRequired')));
    }
    if (value.length < 6) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.pwdLen')));
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.pwdPattern')));
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.confirmRequired')));
    }
    if (value !== form.getFieldValue('newPassword')) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.confirmMismatch')));
    }
    return Promise.resolve();
  };

  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.emailRequired')));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error(t('auth.resetPassword.validation.emailInvalid')));
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
                placeholder={t('auth.resetPassword.emailStep.placeholder')}
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
                {loading ? t('auth.resetPassword.emailStep.sending') : t('auth.resetPassword.emailStep.btn')}
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
              {t('auth.resetPassword.verifyStep.sentTo')}<strong>{email}</strong>
            </div>
            <Form.Item
              name="verificationCode"
              rules={[
                { required: true, message: t('auth.resetPassword.validation.codeRequired') },
                { len: 6, message: t('auth.resetPassword.validation.codeLen') }
              ]}
            >
              <Input
                prefix={<SafetyOutlined className="site-form-item-icon" />}
                placeholder={t('auth.resetPassword.verifyStep.placeholder')}
                maxLength={6}
                allowClear
              />
            </Form.Item>
            <Form.Item>
              <div className="resend-code">
                {countdown > 0 ? (
                  <span className="countdown-text">{countdown}{t('auth.resetPassword.verifyStep.countdown')}</span>
                ) : (
                  <Button
                    type="link"
                    onClick={() => {
                      setCurrentStep(0);
                      form.resetFields();
                    }}
                    className="resend-btn"
                  >
                    {t('auth.resetPassword.verifyStep.resend')}
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
                {loading ? t('auth.resetPassword.verifyStep.verifying') : t('auth.resetPassword.verifyStep.btn')}
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
                placeholder={t('auth.resetPassword.resetStep.newPwdPlaceholder')}
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
                placeholder={t('auth.resetPassword.resetStep.confirmPwdPlaceholder')}
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
                {loading ? t('auth.resetPassword.resetStep.resetting') : t('auth.resetPassword.resetStep.btn')}
              </Button>
            </Form.Item>
          </Form>
        );
      
      case 3:
        return (
          <Result
            status="success"
            title={t('auth.resetPassword.successStep.title')}
            subTitle={t('auth.resetPassword.successStep.subtitle')}
            extra={[
              <Button
                type="primary"
                key="login"
                onClick={() => navigate('/login')}
                className="reset-password-btn"
              >
                {t('auth.resetPassword.successStep.loginBtn')}
              </Button>,
              <Button
                key="home"
                onClick={() => navigate('/')}
              >
                {t('auth.resetPassword.successStep.backHomeBtn')}
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
      title={t('auth.resetPassword.title')}
      subtitle={t('auth.resetPassword.subtitle')}
      loading={loading && currentStep !== 3}
    >
      <div className="reset-password-container">
        {currentStep < 3 && (
          <Steps current={currentStep} className="reset-password-steps" items={[
            { title: t('auth.resetPassword.steps.verifyEmail'), description: t('auth.resetPassword.steps.verifyEmailDesc') },
            { title: t('auth.resetPassword.steps.verifyIdentity'), description: t('auth.resetPassword.steps.verifyIdentityDesc') },
            { title: t('auth.resetPassword.steps.reset'), description: t('auth.resetPassword.steps.resetDesc') },
          ]} />
        )}
        
        <div className="step-content">
          {renderStepContent()}
        </div>
        
        {currentStep < 3 && (
          <div className="back-to-login">
            <Link to="/login" className="back-link">
              ← {t('auth.resetPassword.backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
