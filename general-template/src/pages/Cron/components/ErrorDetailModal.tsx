import React from 'react';
import { Modal, Button } from 'antd';

interface ErrorDetailModalProps {
  open: boolean;
  content?: string;
  onClose: () => void;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ open, content, onClose }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="错误详情"
      footer={<Button onClick={onClose}>关闭</Button>}
    >
      <pre className="error-detail">{content || '无详情'}</pre>
    </Modal>
  );
};

export default ErrorDetailModal;