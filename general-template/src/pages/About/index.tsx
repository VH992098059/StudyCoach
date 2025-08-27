import React from 'react';
import { Typography, Card, Row, Col, Divider } from 'antd';
import { TeamOutlined, TagOutlined, HeartOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const About: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={1} style={{ textAlign: 'center', marginBottom: '48px' }}>
        关于我们
      </Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            cover={
              <div style={{ padding: '24px' }}>
                <TeamOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </div>
            }
          >
            <Card.Meta
              title="我们的团队"
              description="由经验丰富的开发者组成的专业团队，致力于提供高质量的技术解决方案。"
            />
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            cover={
              <div style={{ padding: '24px' }}>
                <TagOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              </div>
            }
          >
            <Card.Meta
              title="我们的使命"
              description="通过创新的技术和优质的服务，帮助客户实现数字化转型和业务增长。"
            />
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card
            hoverable
            style={{ textAlign: 'center', height: '100%' }}
            cover={
              <div style={{ padding: '24px' }}>
                <HeartOutlined style={{ fontSize: '48px', color: '#f5222d' }} />
              </div>
            }
          >
            <Card.Meta
              title="我们的价值观"
              description="以用户为中心，追求卓越品质，持续创新，诚信合作。"
            />
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      
    </div>
  );
};

export default About;