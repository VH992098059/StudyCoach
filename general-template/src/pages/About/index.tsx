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
      
      <Row>
        <Col span={24}>
          <Title level={2}>公司简介</Title>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
            我们是一家专注于前端技术的创新公司，致力于为客户提供现代化的Web解决方案。
            通过使用最新的技术栈和最佳实践，我们帮助企业构建高性能、可维护的Web应用程序。
          </Paragraph>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
            自成立以来，我们已经为众多客户提供了优质的服务，涵盖电商平台、企业官网、
            管理系统等多个领域。我们的团队拥有丰富的项目经验和深厚的技术功底，
            能够为客户提供从需求分析到项目交付的全流程服务。
          </Paragraph>
        </Col>
      </Row>
    </div>
  );
};

export default About;