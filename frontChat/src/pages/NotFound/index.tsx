import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.subtitle')}
        extra={
          <Button type="primary" onClick={handleBackHome}>
          {t('notFound.backHome')}
        </Button>
        }
      />
    </div>
  );
};

export default NotFound;
