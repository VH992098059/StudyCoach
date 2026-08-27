import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="font-mono text-6xl font-bold text-text-3">404</div>
      <div className="text-lg font-medium text-text-1">{t('notFound.title')}</div>
      <div className="text-sm text-text-3">{t('notFound.subtitle')}</div>
      <Button onClick={() => navigate('/')}>{t('notFound.backHome')}</Button>
    </div>
  );
};

export default NotFound;
