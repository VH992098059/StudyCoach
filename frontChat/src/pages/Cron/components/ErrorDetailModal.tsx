import React from 'react';
import { Modal, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface ErrorDetailModalProps {
  open: boolean;
  content?: string;
  onClose: () => void;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ open, content, onClose }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t('cron.logs.details')}
      footer={<Button onClick={onClose}>{t('cron.actions.close')}</Button>}
    >
      <pre className="error-detail">{content || t('cron.logs.noDetails')}</pre>
    </Modal>
  );
};

export default ErrorDetailModal;