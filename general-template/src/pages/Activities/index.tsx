import React from 'react';
import { Typography, Card, Row, Col, Tag, Button, Avatar } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { Meta } = Card;

const Activities: React.FC = () => {
  const activities = [
    {
      id: 1,
      title: '前端技术分享会',
      description: '分享最新的前端技术趋势，包括React 18新特性、性能优化技巧等。',
      date: '2024-02-15',
      time: '14:00-17:00',
      location: '北京市朝阳区科技园',
      organizer: '技术团队',
      participants: 156,
      maxParticipants: 200,
      status: '报名中',
      tags: ['技术', '前端', 'React'],
      image: 'https://via.placeholder.com/300x200?text=Tech+Share',
    },
    {
      id: 2,
      title: '产品设计工作坊',
      description: '学习用户体验设计的最佳实践，从用户研究到原型设计的完整流程。',
      date: '2024-02-20',
      time: '09:00-18:00',
      location: '上海市浦东新区创意园',
      organizer: '设计团队',
      participants: 89,
      maxParticipants: 100,
      status: '报名中',
      tags: ['设计', 'UX', '工作坊'],
      image: 'https://via.placeholder.com/300x200?text=Design+Workshop',
    },
    {
      id: 3,
      title: '开源项目贡献指南',
      description: '如何参与开源项目，从提交第一个PR到成为项目维护者的成长路径。',
      date: '2024-02-25',
      time: '19:00-21:00',
      location: '线上直播',
      organizer: '开源社区',
      participants: 324,
      maxParticipants: 500,
      status: '报名中',
      tags: ['开源', 'GitHub', '社区'],
      image: 'https://via.placeholder.com/300x200?text=Open+Source',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '报名中':
        return 'green';
      case '已满员':
        return 'red';
      case '已结束':
        return 'default';
      default:
        return 'blue';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={1} style={{ textAlign: 'center', marginBottom: '48px' }}>
        活动中心
      </Title>
      
      <Paragraph style={{ textAlign: 'center', fontSize: '16px', marginBottom: '48px' }}>
        参与我们的技术活动，与同行交流学习，共同成长
      </Paragraph>
      
      <Row gutter={[24, 24]}>
        {activities.map((activity) => (
          <Col xs={24} lg={8} key={activity.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              cover={
                <img
                  alt={activity.title}
                  src={activity.image}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              }
              actions={[
                <Button type="primary" key="join">
                  立即报名
                </Button>,
                <Button key="detail">查看详情</Button>,
              ]}
            >
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1 }}>
                <Tag color={getStatusColor(activity.status)}>{activity.status}</Tag>
              </div>
              
              <Meta
                title={activity.title}
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: '16px' }}>
                      {activity.description}
                    </Paragraph>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        <span>{activity.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <ClockCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                        <span>{activity.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <EnvironmentOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                        <span>{activity.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <UserOutlined style={{ marginRight: '8px', color: '#f5222d' }} />
                        <span>{activity.participants}/{activity.maxParticipants} 人</span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      {activity.tags.map((tag) => (
                        <Tag key={tag} color="blue" style={{ marginBottom: '4px' }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '12px', color: '#666' }}>主办：{activity.organizer}</span>
                      </div>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Activities;