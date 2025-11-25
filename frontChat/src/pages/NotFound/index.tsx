import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button type="primary" onClick={handleBackHome}>
          返回AI聊天
        </Button>
        }
      />
    </div>
  );
};

export default NotFound;