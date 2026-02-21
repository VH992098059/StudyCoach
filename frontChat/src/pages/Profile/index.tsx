import React, { useState, useEffect } from 'react';
import { Card, Avatar, Form, Input, Button, message, Space, Typography, Row, Col, Tabs, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, IdcardOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { LoginRegisterService } from '../../services/login_register';
import './index.scss';

const { Title, Text, Paragraph } = Typography;

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; avatar?: string; uuid?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user info', e);
      }
    }
  }, []);

  const handleUpdatePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('profile.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await LoginRegisterService.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success(t('profile.updatePasswordSuccess'));
      form.resetFields();
    } catch (error) {
      message.error(t('profile.updatePasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return null;
  }

  const SecurityTab = () => (
    <div style={{ maxWidth: 600, padding: '24px 0' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdatePassword}
        requiredMark="optional"
      >
        <Form.Item
          name="oldPassword"
          label={t('profile.currentPassword')}
          rules={[{ required: true, message: t('profile.currentPasswordRequired') }]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder={t('profile.currentPassword')} 
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={t('profile.newPassword')}
          rules={[
            { required: true, message: t('profile.newPasswordRequired') },
            { min: 6, message: t('auth.validation.passwordMin') }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder={t('profile.newPassword')} 
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t('profile.confirmPassword')}
          rules={[
            { required: true, message: t('profile.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('profile.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder={t('profile.confirmPassword')} 
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ minWidth: 120 }}>
            {t('profile.updatePassword')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  return (
    <div className="profile-container">
      <Row gutter={[24, 24]}>
        {/* 左侧个人信息卡片 */}
        <Col xs={24} md={8} lg={7} xl={6}>
          <Card bordered={false} className="profile-card user-card">
            <div className="user-profile-header">
              <Avatar 
                size={120} 
                icon={<UserOutlined />} 
                src={userInfo.avatar}
                className="user-avatar"
              />
              <Title level={3} className="user-name">{userInfo.username}</Title>
              <Paragraph type="secondary" copyable={{ text: userInfo.uuid }}>
                <IdcardOutlined style={{ marginRight: 8 }} />
                ID: {userInfo.uuid ? `${userInfo.uuid.substring(0, 8)}...` : 'N/A'}
              </Paragraph>
            </div>
            <Divider />
            <div className="user-stats">
              {/* 这里可以放一些统计信息或者其他个人相关的内容 */}
            </div>
          </Card>
        </Col>

        {/* 右侧设置区域 */}
        <Col xs={24} md={16} lg={17} xl={18}>
          <Card 
            bordered={false} 
            className="profile-card settings-card"
            bodyStyle={{ padding: '0 24px' }}
          >
            <Tabs
              defaultActiveKey="security"
              size="large"
              items={[
                {
                  key: 'security',
                  label: (
                    <span>
                      <SafetyOutlined />
                      {t('profile.securitySettings')}
                    </span>
                  ),
                  children: <SecurityTab />,
                },
                // 未来可以添加更多标签页，如 'profile' (基本资料), 'notification' (通知设置) 等
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
