import React, { useEffect } from 'react';
import { Modal, Input } from 'antd';
import type { KnowledgeChunk } from '@/services/chunks';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

interface ChunkEditModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: () => void;
  chunk: KnowledgeChunk | null;
  content: string;
  onContentChange: (content: string) => void;
}

const ChunkEditModal: React.FC<ChunkEditModalProps> = ({
  open,
  onCancel,
  onSave,
  chunk,
  content,
  onContentChange,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      title={t('kb.chunks.editContent')}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      width={800}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
    >
      <div style={{ marginBottom: 16 }}>
        <strong>{t('kb.chunks.chunkId')}:</strong> {chunk?.chunkId}
      </div>
      <TextArea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={t('kb.chunks.placeholder')}
        rows={10}
        maxLength={5000}
        showCount
      />
    </Modal>
  );
};

export default ChunkEditModal;
